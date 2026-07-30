<?php

namespace App\Domains\Reports\Services;

use App\Domains\Reports\DTOs\ReportFilters;
use App\Models\InventoryTransaction;
use App\Models\Product;

class ProductReportService
{
    /**
     * Product Timeline — complete chronological history of inventory movements
     * for a single product, from opening balance through all transactions.
     *
     * This is the single most valuable debugging and analysis tool in the system.
     */
    public function timeline(ReportFilters $filters): array
    {
        $productId = $filters->productId;
        if (!$productId) {
            throw new \InvalidArgumentException('product_id is required for product timeline.');
        }

        $product = Product::with('category')->findOrFail($productId);

        $movements = InventoryTransaction::where('product_id', $productId)
            ->when($filters->dateFrom, fn($q) => $q->whereDate('date', '>=', $filters->dateFrom))
            ->when($filters->dateTo, fn($q) => $q->whereDate('date', '<=', $filters->dateTo))
            ->orderBy('created_at', 'asc')
            ->get();

        // Compute aggregates
        $totalPurchased = $movements->whereIn('type', ['purchase'])->sum('quantity');
        $totalSold = abs($movements->where('type', 'sale')->sum('quantity'));
        $totalSaleReturned = $movements->where('type', 'sale-return')->sum('quantity');
        $totalPurchaseReturned = abs($movements->where('type', 'purchase-return')->sum('quantity'));
        $totalAdjusted = $movements->where('type', 'adjustment')->sum('quantity');

        return [
            'product' => $product->toArray(),
            'movements' => $movements,
            'summary' => [
                'current_stock' => $product->stock_quantity,
                'stock_value' => round($product->stock_quantity * ($product->last_purchase_cost ?: 0)),
                'total_purchased' => round($totalPurchased),
                'total_sold' => round($totalSold),
                'total_sale_returned' => round($totalSaleReturned),
                'total_purchase_returned' => round($totalPurchaseReturned),
                'total_adjusted' => round($totalAdjusted),
                'net_movements' => round($movements->sum('quantity')),
            ],
        ];
    }
}
