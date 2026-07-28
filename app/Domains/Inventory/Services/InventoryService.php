<?php

namespace App\Domains\Inventory\Services;

use App\Models\InventoryTransaction;
use App\Models\Product;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    public function getOverview(): array
    {
        $totalProducts = Product::count();
        $inStock = Product::where('status', 'in-stock')->count();
        $lowStock = Product::where('status', 'low-stock')->count();
        $outOfStock = Product::where('status', 'out-of-stock')->count();

        $totalValue = Product::select(DB::raw('SUM(stock_quantity * COALESCE(
            (SELECT MIN(sale_price) FROM selling_units WHERE product_id = products.id), 0
        )) as total_value'))->value('total_value') ?? 0;

        $recentMovements = InventoryTransaction::with('product')
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
        int $perPage = 25
    ): LengthAwarePaginator {
        $q = Product::with('category', 'sellingUnits');

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

        $allowedSorts = ['name', 'sku', 'stock_quantity', 'status'];
        $sortBy = in_array($sortBy, $allowedSorts) ? $sortBy : 'name';
        $sortDir = $sortDir === 'desc' ? 'desc' : 'asc';

        $products = $q->orderBy($sortBy, $sortDir)->paginate($perPage);

        // Attach computed stock value per product
        $products->getCollection()->transform(function ($product) {
            $product->stock_value = round($product->stock_quantity * ($product->sellingUnits->min('sale_price') ?? 0));
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
        );
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
    ): InventoryTransaction {
        // Lock the product row for concurrency safety
        $product = Product::lockForUpdate()->findOrFail($productId);

        // Determine if this is a reversal transaction (reference prefixed with REV- should always be allowed)
        $isReversal = $reference !== null && str_starts_with($reference, 'REV-');
        // Determine if negative stock is allowed for this product
        $productAllowsNegative = $product->allow_negative_stock ?? app(\App\Domains\Settings\Services\SettingService::class)->get()['inventory']['allow_negative_stock'] ?? false;

        // Prevent negative stock for sales (unless allowed)
        if ($quantity < 0 && $product->stock_quantity + $quantity < 0 && !$isReversal && !$productAllowsNegative && !($product->track_inventory === false)) {
            throw new \InvalidArgumentException("Insufficient stock for product '{$product->name}' (available: {$product->stock_quantity}, requested: " . abs($quantity) . ")");
        }

        $oldStock = $product->stock_quantity;
        $product->stock_quantity += $quantity;
        $newStock = $product->stock_quantity;

        // Recalculate status
        if ($newStock <= 0) {
            $product->status = 'out-of-stock';
            // Only clamp to 0 if negative stock is NOT allowed
            if (!$productAllowsNegative && !$isReversal) {
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
            'unit' => $product->base_unit_id,
            'packaging_name' => $packagingName,
            'packaging_quantity' => $packagingQuantity,
            'date' => now()->format('Y-m-d'),
            'reference' => $reference ?? 'ADJ-' . now()->format('ymd') . '-' . random_int(1000, 9999),
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
        $q = InventoryTransaction::with('product');

        if ($productId) {
            $q->where('product_id', $productId);
        }

        $sortDir = $sortDir === 'asc' ? 'asc' : 'desc';
        return $q->orderBy('created_at', $sortDir)->paginate($perPage);
    }

    public function getLowStock(): array
    {
        return Product::where('status', 'low-stock')
            ->orWhere('status', 'out-of-stock')
            ->orderBy('stock_quantity')
            ->take(20)
            ->get()
            ->toArray();
    }

    public function getValuation(): array
    {
        $products = Product::with('sellingUnits')->get();
        $total = 0;
        $byCategory = [];

        foreach ($products as $product) {
            $unitCost = $product->sellingUnits->min('sale_price') ?? 0;
            $value = round($product->stock_quantity * $unitCost);
            $total += $value;

            $catName = $product->category?->name ?? 'Uncategorized';
            if (!isset($byCategory[$catName])) {
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
