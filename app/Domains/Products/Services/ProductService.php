<?php

namespace App\Domains\Products\Services;

use App\Domains\Products\DTOs\CreateProductData;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPackaging;
use App\Models\SellingUnit;
use App\Models\InventoryTransaction;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ProductService
{
    public function __construct(
        private readonly PackagingDerivationEngine $derivationEngine,
        private readonly ProductUnitService $productUnitService,
    ) {}

    public function search(string $query = '', ?int $categoryId = null, int $perPage = 25): LengthAwarePaginator
    {
        $q = Product::query();

        if ($query) {
            $q->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('sku', 'like', "%{$query}%")
                  ->orWhere('barcode', 'like', "%{$query}%");
            });
        }

        if ($categoryId) {
            $q->where('category_id', $categoryId);
        }

        return $q->with('category', 'sellingUnits')
                 ->orderBy('name')
                 ->paginate($perPage);
    }

    public function create(CreateProductData $data): Product
    {
        return DB::transaction(function () use ($data) {
            // 1. Create the product record
            $product = Product::create($data->toArray());

            // 2. Record opening stock as inventory transaction if > 0
            if ($product->stock_quantity > 0) {
                InventoryTransaction::create([
                    'product_id' => $product->id,
                    'type' => 'adjustment',
                    'quantity' => $product->stock_quantity,
                    'unit' => $product->base_unit_id,
                    'date' => now()->format('Y-m-d'),
                    'reference' => 'INITIAL',
                    'notes' => 'Opening stock (initial)',
                    'user' => $data->createdBy,
                    'running_balance' => $product->stock_quantity,
                    'reference_type' => 'product',
                    'reference_id' => $product->id,
                ]);
            }

            // 3. Update status based on opening stock
            if ($product->stock_quantity <= 0) {
                $product->status = 'out-of-stock';
                $product->save();
            } elseif ($product->stock_quantity <= $product->low_stock_threshold) {
                $product->status = 'low-stock';
                $product->save();
            } else {
                $product->status = 'in-stock';
                $product->save();
            }

            // 4. Handle packaging levels (if provided)
            if (!empty($data->packaging)) {
                $this->savePackaging($product->id, $data->packaging);

                // Derive selling units from packaging structure
                $this->derivationEngine->derive($product->id);
            }

            // 5. Handle explicit selling units (legacy behaviour, for products
            //    without packaging or additional custom units)
            if (!empty($data->sellingUnits)) {
                foreach ($data->sellingUnits as $unit) {
                    $product->sellingUnits()->create([
                        'name' => $unit['name'],
                        'unit_id' => $unit['unit_id'] ?? $data->baseUnitId,
                        'quantity' => $unit['quantity'] ?? 1,
                        'sale_price' => $unit['sale_price'] ?? 0,
                        'is_default' => $unit['is_default'] ?? false,
                    ]);
                }
            }

            // 6. Ensure at least one default selling unit exists
            if ($product->sellingUnits()->count() === 0) {
                $unitName = $this->productUnitService->resolveDisplayUnit($data->baseUnitId);
                $product->sellingUnits()->create([
                    'name' => $unitName,
                    'unit_id' => $data->baseUnitId,
                    'quantity' => 1,
                    'sale_price' => 0,
                    'is_default' => true,
                ]);
            }

            // 7. Ensure exactly one default selling unit
            $this->ensureSingleDefault($product->id);

            return $product->load('category', 'sellingUnits', 'packaging');
        });
    }

    public function update(int $id, array $data): Product
    {
        return DB::transaction(function () use ($id, $data) {
            $product = Product::findOrFail($id);
            $product->update($data);

            // If packaging levels were provided, update them and re-derive
            if (array_key_exists('packaging', $data)) {
                // Delete existing packaging levels and replace
                $product->packaging()->delete();

                if (!empty($data['packaging'])) {
                    $this->savePackaging($product->id, $data['packaging']);
                    $this->derivationEngine->derive($product->id);
                } else {
                    // Packaging was cleared — clean up derived selling units.
                    // This nulls packaging_id on customized units and deletes
                    // non-customized ones (handled by the derivation engine's
                    // cleanup with an empty active unit set).
                    $this->derivationEngine->derive($product->id);
                }
            }

            // Sync explicit selling units (legacy/custom path — mirrors create).
            // When packaging levels were just re-derived above, the derivation
            // engine owns the units, so skip reconciliation to avoid
            // duplicating/overwriting derived units. Custom (non-packaged)
            // products fall through and keep their explicit units in sync.
            $packagingProvided = array_key_exists('packaging', $data) && !empty($data['packaging']);
            if (array_key_exists('selling_units', $data) && !$packagingProvided) {
                $this->syncSellingUnits($product->id, $data['selling_units']);
            }

            // Recalculate product status based on stock
            if ($product->stock_quantity <= 0) {
                $product->status = 'out-of-stock';
                $product->save();
            } elseif ($product->stock_quantity <= $product->low_stock_threshold) {
                $product->status = 'low-stock';
                $product->save();
            } else {
                $product->status = 'in-stock';
                $product->save();
            }

            return $product->load('category', 'sellingUnits', 'packaging');
        });
    }

    public function delete(int $id): ?bool
    {
        return DB::transaction(function () use ($id) {
            $product = Product::findOrFail($id);

            // Delete packaging levels (cascades to nullify packaging_id on selling units)
            $product->packaging()->delete();

            return $product->delete();
        });
    }

    public function restore(int $id): Product
    {
        $product = Product::withTrashed()->findOrFail($id);
        $product->restore();
        return $product;
    }

    public function get(int $id): Product
    {
        return Product::with('category', 'sellingUnits', 'packaging.containerUnit', 'packaging.containsUnit')
            ->findOrFail($id);
    }

    public function generateSku(string $name): string
    {
        $prefix = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $name), 0, 3));
        $count = Product::withTrashed()->where('sku', 'like', "{$prefix}-%")->count() + 1;
        $sku = "{$prefix}-" . str_pad((string) $count, 4, '0', STR_PAD_LEFT);

        if (Product::withTrashed()->where('sku', $sku)->exists()) {
            $sku = "{$prefix}-" . str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);
        }

        return $sku;
    }

    public function allCategories(): array
    {
        return Category::orderBy('name')->get()->toArray();
    }

    /**
     * Save packaging levels for a product (replaces any existing levels).
     */
    private function savePackaging(int $productId, array $levels): void
    {
        $rows = [];
        foreach ($levels as $level) {
            $rows[] = [
                'product_id'        => $productId,
                'container_unit_id' => $level['container_unit_id'],
                'contains_unit_id'  => $level['contains_unit_id'],
                'quantity'          => $level['quantity'],
                'level'             => $level['level'],
                'created_at'        => now(),
                'updated_at'        => now(),
            ];
        }

        ProductPackaging::insert($rows);
    }

    /**
     * Ensure exactly one selling unit is marked as default.
     */
    private function ensureSingleDefault(int $productId): void
    {
        $defaults = SellingUnit::where('product_id', $productId)
            ->where('is_default', true)
            ->get();

        if ($defaults->count() > 1) {
            // Keep only the first default, clear others
            $first = $defaults->shift();
            SellingUnit::whereIn('id', $defaults->pluck('id'))
                ->update(['is_default' => false]);
        }
    }

    /**
     * Reconcile the product's custom (non-derived) selling units against the
     * submitted payload.
     *
     * Units generated by the packaging derivation engine (packaging_id NOT
     * NULL) are ignored here — the engine owns them. Custom units are matched
     * positionally so an edit updates in place (preserving ids), creates new
     * units when the list grows, and removes custom units the user deleted.
     */
    private function syncSellingUnits(int $productId, array $provided): void
    {
        $existing = SellingUnit::where('product_id', $productId)
            ->whereNull('packaging_id')
            ->orderBy('id')
            ->get();

        $existingCount = $existing->count();
        $seen = [];

        foreach ($provided as $i => $unit) {
            $payload = [
                'name'            => $unit['name'] ?? ('Unit ' . ($i + 1)),
                'unit_id'         => $unit['unit_id'] ?? ($unit['name'] ?? 'Unit'),
                'quantity'        => isset($unit['quantity']) ? (float) $unit['quantity'] : 1.0,
                'sale_price'      => isset($unit['sale_price']) ? (float) $unit['sale_price'] : 0.0,
                'is_default'      => isset($unit['is_default']) && $unit['is_default'],
                'product_unit_id' => $unit['product_unit_id'] ?? null,
            ];

            // Default the first unit if none is explicitly marked.
            if ($i === 0 && !array_key_exists('is_default', $unit)) {
                $payload['is_default'] = true;
            }

            // Update in place when the position maps to a matching custom unit;
            // otherwise create a fresh unit.
            if ($i < $existingCount) {
                $target = $existing->get($i);
                if ($target !== null && $target->product_unit_id === $payload['product_unit_id']) {
                    $target->update($payload);
                    $seen[] = $target->id;
                    continue;
                }
            }

            $created = SellingUnit::create(array_merge(['product_id' => $productId], $payload));
            $seen[] = $created->id;
        }

        // Remove custom units that are no longer part of the submission.
        if (!empty($seen)) {
            SellingUnit::where('product_id', $productId)
                ->whereNull('packaging_id')
                ->whereNotIn('id', $seen)
                ->delete();
        }

        $this->ensureSingleDefault($productId);
    }

}
