<?php

namespace App\Domains\Reports\Services;

use App\Domains\Reports\DTOs\ReportFilters;
use App\Models\InventoryTransaction;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class InventoryReportService
{
    /**
     * Stock Summary — current stock levels grouped by category.
     */
    public function stockSummary(ReportFilters $filters): array
    {
        $productQuery = Product::with('category', 'sellingUnits')
            ->when($filters->categoryId, fn($q) => $q->where('category_id', $filters->categoryId))
            ->when($filters->search, fn($q) => $q->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters->search}%")
                  ->orWhere('sku', 'like', "%{$filters->search}%");
            }))
            ->orderBy('name');

        $isPaginated = $filters->perPage > 0;
        $products = $isPaginated ? $productQuery->paginate($filters->perPage) : $productQuery->get();
        $productCollection = $isPaginated ? collect($products->items()) : $products;

        $totalValue = 0;
        $byCategory = [];

        foreach ($productCollection as $p) {
            $cost = $p->sellingUnits->min('sale_price') ?? 0;
            $value = $p->stock_quantity * $cost;
            $totalValue += $value;
            $cat = $p->category?->name ?? 'Uncategorized';
            if (!isset($byCategory[$cat])) {
                $byCategory[$cat] = ['category' => $cat, 'products' => 0, 'value' => 0];
            }
            $byCategory[$cat]['products']++;
            $byCategory[$cat]['value'] += round($value);
        }

        return [
            'products' => $isPaginated ? $products->items() : $productCollection->all(),
            'meta' => $isPaginated ? [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ] : null,
            'summary' => [
                'total_products' => $productCollection->count(),
                'total_stock' => round($productCollection->sum('stock_quantity')),
                'low_stock' => Product::where('status', 'low-stock')->count(),
                'out_of_stock' => Product::where('status', 'out-of-stock')->count(),
                'total_value' => round($totalValue),
            ],
            'by_category' => array_values($byCategory),
        ];
    }

    /**
     * Stock Ledger — all inventory transactions for a specific product or all.
     */
    public function stockLedger(ReportFilters $filters): array
    {
        $query = InventoryTransaction::with('product')
            ->when($filters->productId, fn($q) => $q->where('product_id', $filters->productId))
            ->when($filters->type, fn($q) => $q->where('type', $filters->type))
            ->when($filters->dateFrom, fn($q) => $q->whereDate('date', '>=', $filters->dateFrom))
            ->when($filters->dateTo, fn($q) => $q->whereDate('date', '<=', $filters->dateTo))
            ->when($filters->search, fn($q) => $q->whereHas('product', fn($pq) => $pq->where('name', 'like', "%{$filters->search}%")))
            ->orderBy('created_at', $filters->sortDir);

        $movements = $filters->perPage ? $query->paginate($filters->perPage) : $query->get();

        return [
            'movements' => $filters->perPage ? $movements->items() : $movements,
            'meta' => $filters->perPage ? [
                'current_page' => $movements->currentPage(),
                'last_page' => $movements->lastPage(),
                'per_page' => $movements->perPage(),
                'total' => $movements->total(),
            ] : null,
        ];
    }

    /**
     * Low Stock — products below their low stock threshold.
     */
    public function lowStock(ReportFilters $filters): array
    {
        $products = Product::with('category')
            ->whereIn('status', ['low-stock', 'out-of-stock'])
            ->when($filters->categoryId, fn($q) => $q->where('category_id', $filters->categoryId))
            ->when($filters->search, fn($q) => $q->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters->search}%")
                  ->orWhere('sku', 'like', "%{$filters->search}%");
            }))
            ->orderBy('stock_quantity')
            ->paginate($filters->perPage);

        return [
            'products' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ];
    }

    /**
     * Stock Valuation — total stock value using best available cost.
     */
    public function valuation(): array
    {
        $products = Product::with('sellingUnits')->get();
        $total = 0;
        $byCategory = [];

        foreach ($products as $p) {
            $cost = $p->sellingUnits->min('sale_price') ?? 0;
            $value = round($p->stock_quantity * $cost);
            $total += $value;

            $cat = $p->category?->name ?? 'Uncategorized';
            if (!isset($byCategory[$cat])) {
                $byCategory[$cat] = ['category' => $cat, 'products' => 0, 'value' => 0];
            }
            $byCategory[$cat]['products']++;
            $byCategory[$cat]['value'] += $value;
        }

        return [
            'total_value' => round($total),
            'by_category' => array_values($byCategory),
        ];
    }
}
