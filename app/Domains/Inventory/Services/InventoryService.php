<?php

namespace App\Domains\Inventory\Services;

use App\Domains\Settings\Services\SettingService;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductComposition;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    public function getOverview(): array
    {
        $totalProducts = Product::excludingFormulaOnly()->count();
        $inStock = Product::excludingFormulaOnly()->where('status', 'in-stock')->count();
        $lowStock = Product::excludingFormulaOnly()->where('status', 'low-stock')->count();
        $outOfStock = Product::excludingFormulaOnly()->where('status', 'out-of-stock')->count();

        $totalValue = Product::excludingFormulaOnly()->select(DB::raw('SUM(stock_quantity * COALESCE(
            (SELECT MIN(sale_price) FROM selling_units WHERE product_id = products.id), 0
        )) as total_value'))->value('total_value') ?? 0;

        $recentMovements = InventoryTransaction::with(['product' => fn ($q) => $q->withArchived()])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->toArray();

        return [
            'total_products' => $totalProducts,
            'in_stock' => $inStock,
            'low_stock' => $lowStock,
            'out_of_stock' => $outOfStock,
            'total_value' => round($totalValue),
            'recent_movements' => $recentMovements,
        ];
    }

    public function search(
        string $query = '',
        ?string $status = null,
        ?int $categoryId = null,
        string $sortBy = 'name',
        string $sortDir = 'asc',
        int $perPage = 25,
        string $archived = 'active',
        ?string $composition = null,
    ): LengthAwarePaginator {
        // Archived products are hidden everywhere by Product's global scope; this
        // filter is the one browsing surface that can opt them back in.
        $q = match ($archived) {
            'archived' => Product::withArchived()->whereNotNull('products.archived_at'),
            'all' => Product::withArchived(),
            default => Product::query(),
        };

        $q->with('category', 'sellingUnits')
            ->withCount(['compositions as ingredient_count' => fn ($composition) => $composition
                ->where('kind', ProductComposition::KIND_CONSUMPTION)
                ->where('is_active', true)])
            ->withExists([
                'compositions as has_consumption_composition' => fn ($composition) => $composition
                    ->where('kind', ProductComposition::KIND_CONSUMPTION)
                    ->where('is_active', true),
                'compositions as has_assembly_composition' => fn ($composition) => $composition
                    ->where('kind', ProductComposition::KIND_ASSEMBLY)
                    ->where('is_active', true),
            ]);

        if ($query) {
            $q->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('sku', 'like', "%{$query}%")
                    ->orWhere('barcode', 'like', "%{$query}%");
            });
        }

        if ($status && $status !== 'all') {
            $q->where('status', $status);
        }

        if ($categoryId) {
            $q->where('category_id', $categoryId);
        }

        if ($composition === 'formula') {
            $q->whereHas('compositions', fn ($query) => $query
                ->where('kind', ProductComposition::KIND_CONSUMPTION)
                ->where('is_active', true));
        } elseif ($composition === 'assembly') {
            $q->whereHas('compositions', fn ($query) => $query
                ->where('kind', ProductComposition::KIND_ASSEMBLY)
                ->where('is_active', true));
        }

        $allowedSorts = ['name', 'sku', 'stock_quantity', 'status'];
        $sortBy = in_array($sortBy, $allowedSorts) ? $sortBy : 'name';
        $sortDir = $sortDir === 'desc' ? 'desc' : 'asc';

        $products = $q->orderBy($sortBy, $sortDir)->paginate($perPage);

        // Attach computed stock value per product. Formula-only records hold no
        // stock of their own, so they carry no stock value.
        $products->getCollection()->transform(function ($product) {
            $isFormulaOnly = (bool) $product->has_consumption_composition
                && ! (bool) $product->has_assembly_composition;

            $product->stock_value = $isFormulaOnly
                ? null
                : round($product->stock_quantity * ($product->sellingUnits->min('sale_price') ?? 0));

            return $product;
        });

        return $products;
    }

    /**
     * Record a purchase inventory movement (increases stock).
     */
    public function recordPurchase(
        int $productId,
        float $quantity,
        ?string $packagingName = null,
        ?float $packagingQuantity = null,
        ?string $reference = null,
        ?string $notes = null,
        ?string $user = null,
        ?int $referenceId = null,
        ?float $unitCost = null,
        ?string $documentDate = null,
    ): InventoryTransaction {
        return $this->applyMovement(
            productId: $productId,
            type: 'purchase',
            quantity: $quantity,
            packagingName: $packagingName,
            packagingQuantity: $packagingQuantity,
            reference: $reference,
            notes: $notes,
            user: $user,
            referenceType: 'purchase',
            referenceId: $referenceId,
            unitCost: $unitCost,
            documentDate: $documentDate,
        );
    }

    /**
     * Record a sale inventory movement (decreases stock).
     */
    public function recordSale(
        int $productId,
        float $quantity,
        ?string $packagingName = null,
        ?float $packagingQuantity = null,
        ?string $reference = null,
        ?string $notes = null,
        ?string $user = null,
        ?int $referenceId = null,
        bool $bypassStockCheck = false,
        ?float $unitCost = null,
        ?string $documentDate = null,
    ): InventoryTransaction {
        return $this->applyMovement(
            productId: $productId,
            type: 'sale',
            quantity: -$quantity,
            packagingName: $packagingName,
            packagingQuantity: $packagingQuantity,
            reference: $reference,
            notes: $notes,
            user: $user,
            referenceType: 'sale',
            referenceId: $referenceId,
            bypassStockCheck: $bypassStockCheck,
            unitCost: $unitCost,
            documentDate: $documentDate,
        );
    }

    /**
     * Record a component consumption movement (decreases stock).
     */
    public function recordConsumption(
        int $productId,
        float $quantity,
        ?string $packagingName = null,
        ?float $packagingQuantity = null,
        ?string $reference = null,
        ?string $notes = null,
        ?string $user = null,
        ?int $referenceId = null,
        bool $bypassStockCheck = false,
        ?float $unitCost = null,
        ?string $documentDate = null,
    ): InventoryTransaction {
        if ($quantity <= 0) {
            throw new \InvalidArgumentException('Consumption quantity must be positive.');
        }

        return $this->applyMovement(
            productId: $productId,
            type: 'consumption',
            quantity: -$quantity,
            packagingName: $packagingName,
            packagingQuantity: $packagingQuantity,
            reference: $reference,
            notes: $notes,
            user: $user,
            referenceType: 'consumption',
            referenceId: $referenceId,
            bypassStockCheck: $bypassStockCheck,
            unitCost: $unitCost,
            documentDate: $documentDate,
        );
    }

    /**
     * Record a production receipt or production reversal (signed quantity).
     */
    public function recordProduction(
        int $productId,
        float $quantity,
        ?string $reference = null,
        ?string $notes = null,
        ?string $user = null,
        ?int $referenceId = null,
        ?float $unitCost = null,
        ?string $documentDate = null,
    ): InventoryTransaction {
        if (abs($quantity) < 0.000001) {
            throw new \InvalidArgumentException('Production quantity must not be zero.');
        }

        return $this->applyMovement(
            productId: $productId,
            type: 'production',
            quantity: $quantity,
            reference: $reference,
            notes: $notes,
            user: $user,
            referenceType: 'production',
            referenceId: $referenceId,
            unitCost: $unitCost,
            documentDate: $documentDate,
        );
    }

    /**
     * Record a return inventory movement (reverses stock movement).
     */
    public function recordReturn(
        int $productId,
        float $quantity,
        string $returnType = 'sale',
        ?string $packagingName = null,
        ?float $packagingQuantity = null,
        ?string $reference = null,
        ?string $notes = null,
        ?string $user = null,
        ?int $referenceId = null,
        ?float $unitCost = null,
        ?string $documentDate = null,
    ): InventoryTransaction {
        $direction = $returnType === 'purchase' ? -$quantity : $quantity;

        return $this->applyMovement(
            productId: $productId,
            type: "{$returnType}-return",
            quantity: $direction,
            packagingName: $packagingName,
            packagingQuantity: $packagingQuantity,
            reference: $reference,
            notes: $notes,
            user: $user,
            referenceType: 'return',
            referenceId: $referenceId,
            unitCost: $unitCost,
            documentDate: $documentDate,
        );
    }

    /**
     * Record an adjustment inventory movement.
     */
    public function recordAdjustment(
        int $productId,
        float $quantity,
        string $type = 'adjustment',
        ?string $reference = null,
        ?string $notes = null,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $packagingName = null,
        ?float $packagingQuantity = null,
        ?string $user = null,
        ?float $unitCost = null,
        ?string $documentDate = null,
    ): InventoryTransaction {
        return $this->applyMovement(
            productId: $productId,
            type: $type,
            quantity: $quantity,
            packagingName: $packagingName,
            packagingQuantity: $packagingQuantity,
            reference: $reference,
            notes: $notes,
            referenceType: $referenceType ?? 'manual',
            referenceId: $referenceId,
            user: $user,
            unitCost: $unitCost,
            documentDate: $documentDate,
        );
    }

    /**
     * Whether stock may go negative for a product.
     *
     * Single source of truth for the negative-stock policy: an explicit
     * per-product choice wins, otherwise the business-wide inventory setting.
     * Every stock writer and every preflight must use this so a formula
     * ingredient follows exactly the same rule as a product sold directly.
     */
    public function allowsNegativeStock(Product $product): bool
    {
        if ($product->allow_negative_stock !== null) {
            return (bool) $product->allow_negative_stock;
        }

        return (bool) (app(SettingService::class)->get()['inventory']['allow_negative_stock'] ?? true);
    }

    /**
     * Shared internal logic for all inventory movements.
     */
    private function applyMovement(
        int $productId,
        string $type,
        float $quantity,
        ?string $packagingName = null,
        ?float $packagingQuantity = null,
        ?string $reference = null,
        ?string $notes = null,
        ?string $user = null,
        ?string $referenceType = null,
        ?int $referenceId = null,
        bool $bypassStockCheck = false,
        ?float $unitCost = null,
        ?string $documentDate = null,
    ): InventoryTransaction {
        // Lock the product row for concurrency safety. Archived products still
        // need returns and lifecycle reversals, so bypass the archive scope here.
        $product = Product::withArchived()->lockForUpdate()->findOrFail($productId);

        // Determine if this is a reversal transaction (reference prefixed with REV- should always be allowed)
        $isReversal = $reference !== null && str_starts_with($reference, 'REV-');
        $productAllowsNegative = $this->allowsNegativeStock($product);

        // Prevent negative stock for sales (unless allowed or bypassed by user confirmation)
        if ($quantity < 0 && $product->stock_quantity + $quantity < 0 && ! $isReversal && ! $productAllowsNegative && ! ($product->track_inventory === false) && ! $bypassStockCheck) {
            throw new \InvalidArgumentException("Insufficient stock for product '{$product->name}' (available: {$product->stock_quantity}, requested: ".abs($quantity).')');
        }

        $oldStock = $product->stock_quantity;
        $product->stock_quantity += $quantity;
        $newStock = $product->stock_quantity;

        // Recalculate status
        if ($newStock <= 0) {
            $product->status = 'out-of-stock';
            // Only clamp to 0 if negative stock is NOT allowed
            if (! $productAllowsNegative && ! $isReversal) {
                $product->stock_quantity = max(0, $newStock);
            }
        } elseif ($newStock <= $product->low_stock_threshold) {
            $product->status = 'low-stock';
        } else {
            $product->status = 'in-stock';
        }
        $product->save();

        return InventoryTransaction::create([
            'product_id' => $productId,
            'type' => $type,
            'quantity' => $quantity,
            'unit_cost' => $unitCost,
            'unit' => $product->base_unit_id,
            'packaging_name' => $packagingName,
            'packaging_quantity' => $packagingQuantity,
            'date' => now()->format('Y-m-d'),
            'document_date' => $documentDate,
            'reference' => $reference ?? 'ADJ-'.now()->format('ymd').'-'.random_int(1000, 9999),
            'notes' => $notes,
            'user' => $user,
            'running_balance' => $product->stock_quantity,
            'reference_type' => $referenceType ?? 'manual',
            'reference_id' => $referenceId,
        ]);
    }

    /**
     * Legacy method — kept for backward compatibility. Prefer intent-specific methods.
     */
    public function recordTransaction(
        int $productId,
        string $type,
        float $quantity,
        ?string $notes = null,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $packagingName = null,
        ?float $packagingQuantity = null,
    ): InventoryTransaction {
        return $this->recordAdjustment(
            productId: $productId,
            type: $type,
            quantity: $quantity,
            notes: $notes,
            referenceType: $referenceType,
            referenceId: $referenceId,
            packagingName: $packagingName,
            packagingQuantity: $packagingQuantity,
        );
    }

    public function getMovements(?int $productId = null, string $sortDir = 'desc', int $perPage = 25): LengthAwarePaginator
    {
        // History still renders for archived products — it records what happened.
        $q = InventoryTransaction::with(['product' => fn ($q) => $q->withArchived()]);

        if ($productId) {
            $q->where('product_id', $productId);
        }

        $sortDir = $sortDir === 'asc' ? 'asc' : 'desc';

        return $q->orderBy('created_at', $sortDir)->paginate($perPage);
    }

    public function getLowStock(): array
    {
        // Formula-only products hold no own stock; a zero balance is not an alert.
        return Product::excludingFormulaOnly()
            ->where(function ($q) {
                $q->where('status', 'low-stock')
                    ->orWhere('status', 'out-of-stock');
            })
            ->orderBy('stock_quantity')
            ->take(20)
            ->get()
            ->toArray();
    }

    public function getValuation(): array
    {
        $products = Product::excludingFormulaOnly()->with('sellingUnits')->get();
        $total = 0;
        $byCategory = [];

        foreach ($products as $product) {
            $unitCost = $product->sellingUnits->min('sale_price') ?? 0;
            $value = round($product->stock_quantity * $unitCost);
            $total += $value;

            $catName = $product->category?->name ?? 'Uncategorized';
            if (! isset($byCategory[$catName])) {
                $byCategory[$catName] = ['category' => $catName, 'products' => 0, 'value' => 0];
            }
            $byCategory[$catName]['products']++;
            $byCategory[$catName]['value'] += $value;
        }

        return [
            'total_value' => round($total),
            'by_category' => array_values($byCategory),
        ];
    }
}
