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
                $unitName = $this->resolveUnitName($data->baseUnitId);
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
     * Resolve a human-readable unit name from a unit ID.
     */
    public function resolveUnitName(?string $unitId): string
    {
        $units = [
            'piece' => 'Piece', 'capsule' => 'Capsule', 'tablet' => 'Tablet',
            'bottle' => 'Bottle', 'box' => 'Box', 'carton' => 'Carton',
            'strip' => 'Strip', 'sachet' => 'Sachet',
            'kilogram' => 'Kilogram (kg)', 'kg' => 'Kilogram (kg)',
            'gram' => 'Gram (g)', 'g' => 'Gram (g)',
            'milligram' => 'Milligram (mg)', 'mg' => 'Milligram (mg)',
            'litre' => 'Litre (L)', 'liter' => 'Litre (L)',
            'millilitre' => 'Millilitre (ml)', 'ml' => 'Millilitre (ml)',
            'meter' => 'Meter', 'cm' => 'Centimetre (cm)',
        ];
        $key = strtolower((string) $unitId);
        return $units[$key] ?? $unitId ?? 'Unit';
    }
}
