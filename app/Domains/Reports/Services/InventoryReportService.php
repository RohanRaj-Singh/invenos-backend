<?php

namespace App\Domains\Reports\Services;

use App\Domains\Reports\DTOs\ReportFilters;
use App\Models\InventoryTransaction;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class InventoryReportService
{
    /**
     * Inventory intelligence report — the redesigned Stock Report.
     *
     * Returns summary cards, an attention section (negative/out-of-stock/
     * low-stock), period movement (opening → closing via the authoritative
     * inventory transaction ledger), top selling, most returned, a valuation
     * breakdown, and a server-paginated product table.
     *
     * Summary/attention/valuation are computed over the FULL filtered set;
     * only the product table is paginated.
     */
    public function stockReport(ReportFilters $filters): array
    {
        [$from, $to] = $this->resolveRange($filters);

        $base = $this->scopedProducts($filters)->get([
            'id', 'name', 'sku', 'status', 'stock_quantity', 'low_stock_threshold',
            'last_purchase_cost', 'default_purchase_cost', 'base_unit_id', 'category_id',
        ]);

        $productIds = $base->pluck('id')->all();

        // ── Summary (full filtered set) ────────────────────────────
        $summary = [
            'total_products' => $base->count(),
            'total_stock' => round($base->sum('stock_quantity')),
            'total_value' => round($base->sum(fn ($p) => $p->stock_quantity * $this->productCost($p))),
            'low_stock' => $base->where('status', 'low-stock')->count(),
            'out_of_stock' => $base->where('status', 'out-of-stock')->count(),
            'negative_stock' => $base->where('stock_quantity', '<', 0)->count(),
        ];

        // ── Attention (actionable) ─────────────────────────────────
        $attention = [
            'negative' => $this->attentionRows($base->filter(fn ($p) => $p->stock_quantity < 0)),
            'out_of_stock' => $this->attentionRows($base->filter(fn ($p) => $p->status === 'out-of-stock')),
            'low_stock' => $this->attentionRows($base->filter(fn ($p) => $p->status === 'low-stock')),
        ];

        // ── Movement (period, authoritative ledger) ────────────────
        $movement = $this->stockMovement($from, $to, $productIds, $summary['total_stock']);

        // ── Top selling + most returned (period) ───────────────────
        $topSelling = $this->topSelling($from, $to, $productIds, 10);
        $mostReturned = $this->mostReturned($from, $to, $productIds, 10);

        // ── Valuation (purchase-cost basis, largest value first) ───
        $valuation = $base
            ->map(fn ($p) => [
                'product' => $p->name,
                'sku' => $p->sku,
                'unit' => $p->base_unit_name,
                'quantity' => $p->stock_quantity,
                'cost' => $this->productCost($p),
                'value' => round($p->stock_quantity * $this->productCost($p)),
                'status' => $p->status,
            ])
            ->sortByDesc('value')
            ->take(15)
            ->values()
            ->all();

        // ── Detailed product table (server paginated; perPage 0 = all rows) ──
        $productQuery = $this->scopedProducts($filters)->with('category')->orderBy('name');

        $paginated = $filters->perPage > 0;
        $pageRows = $paginated
            ? $productQuery->paginate($filters->perPage, ['*'], 'page', $filters->page ?? 1)
            : $productQuery->get();
        $pageItems = $paginated ? $pageRows->items() : $pageRows->all();

        $periodStats = $this->periodStatsByProduct($from, $to, collect($pageItems)->pluck('id')->all());

        $products = collect($pageItems)->map(function ($p) use ($periodStats) {
            $stats = $periodStats[$p->id] ?? ['sold' => 0, 'purchased' => 0, 'returns' => 0];
            $cost = $this->productCost($p);
            return [
                'id' => $p->id,
                'name' => $p->name,
                'sku' => $p->sku,
                'category' => $p->category?->name ?? null,
                'category_id' => $p->category_id,
                'unit' => $p->base_unit_name,
                'stock_quantity' => $p->stock_quantity,
                'low_stock_threshold' => $p->low_stock_threshold,
                'status' => $p->status,
                'sold' => $stats['sold'],
                'purchased' => $stats['purchased'],
                'returns' => $stats['returns'],
                'cost' => $cost,
                'value' => round($p->stock_quantity * $cost),
            ];
        })->all();

        // ── Category breakdown (full filtered set) ─────────────────
        $byCategory = $base->groupBy(fn ($p) => $p->category_id ?: 'none')->map(function ($group) {
            $name = $group->first()->category?->name ?? 'Uncategorized';
            return [
                'category' => $name,
                'products' => $group->count(),
                'value' => round($group->sum(fn ($p) => $p->stock_quantity * $this->productCost($p))),
            ];
        })->sortByDesc('value')->values()->all();

        return [
            'summary' => $summary,
            'attention' => $attention,
            'movement' => $movement,
            'top_selling' => $topSelling,
            'most_returned' => $mostReturned,
            'valuation' => [
                'method' => 'Based on recorded purchase cost (last purchase cost, falling back to default purchase cost)',
                'total_value' => $summary['total_value'],
                'rows' => $valuation,
            ],
            'by_category' => $byCategory,
            'products' => $products,
            'meta' => $paginated ? [
                'current_page' => $pageRows->currentPage(),
                'last_page' => $pageRows->lastPage(),
                'per_page' => $pageRows->perPage(),
                'total' => $pageRows->total(),
            ] : null,
            'period' => ['from' => $from, 'to' => $to],
        ];
    }

    /**
     * Stock Summary — backward-compatible shape used by the dashboard widget,
     * the legacy ReportService facade, and CSV export.
     *
     * Aggregates are computed over the FULL filtered set (not the current page)
     * so summary cards are never skewed by pagination.
     */
    public function stockSummary(ReportFilters $filters): array
    {
        $base = $this->scopedProducts($filters)->get([
            'id', 'name', 'sku', 'status', 'stock_quantity', 'low_stock_threshold',
            'last_purchase_cost', 'default_purchase_cost', 'base_unit_id', 'category_id',
        ]);

        $productIds = $base->pluck('id')->all();
        $totalValue = round($base->sum(fn ($p) => $p->stock_quantity * $this->productCost($p)));

        $byCategory = $base->groupBy(fn ($p) => $p->category_id ?: 'none')->map(function ($group) {
            $name = $group->first()->category?->name ?? 'Uncategorized';
            return [
                'category' => $name,
                'products' => $group->count(),
                'value' => round($group->sum(fn ($p) => $p->stock_quantity * $this->productCost($p))),
            ];
        })->sortByDesc('value')->values()->all();

        $productQuery = $this->scopedProducts($filters)->with('category')->orderBy('name');

        if ($filters->perPage > 0) {
            $paginator = $productQuery->paginate($filters->perPage, ['*'], 'page', $filters->page ?? 1);
            $products = $paginator->items();
            $meta = [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ];
        } else {
            $products = $productQuery->get();
            $meta = null;
        }

        return [
            'products' => $products,
            'meta' => $meta,
            'summary' => [
                'total_products' => $base->count(),
                'total_stock' => round($base->sum('stock_quantity')),
                'low_stock' => $base->where('status', 'low-stock')->count(),
                'out_of_stock' => $base->where('status', 'out-of-stock')->count(),
                'negative_stock' => $base->where('stock_quantity', '<', 0)->count(),
                'total_value' => $totalValue,
            ],
            'by_category' => $byCategory,
        ];
    }

    /**
     * Stock Ledger — all inventory transactions for a specific product or all.
     */
    public function stockLedger(ReportFilters $filters): array
    {
        $query = InventoryTransaction::with('product')
            ->when($filters->productId, fn ($q) => $q->where('product_id', $filters->productId))
            ->when($filters->type, fn ($q) => $q->where('type', $filters->type))
            ->when($filters->dateFrom, fn ($q) => $q->whereDate('date', '>=', $filters->dateFrom))
            ->when($filters->dateTo, fn ($q) => $q->whereDate('date', '<=', $filters->dateTo))
            ->when($filters->search, fn ($q) => $q->whereHas('product', fn ($pq) => $pq->where('name', 'like', "%{$filters->search}%")))
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
            ->when($filters->categoryId, fn ($q) => $q->where('category_id', $filters->categoryId))
            ->when($filters->search, fn ($q) => $q->where(function ($q) use ($filters) {
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
     * Stock Valuation — total stock value using the established purchase-cost
     * methodology (last purchase cost, falling back to default purchase cost).
     */
    public function valuation(): array
    {
        $products = Product::get();
        $total = 0;
        $byCategory = [];

        foreach ($products as $p) {
            $cost = $this->productCost($p);
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

    // ─────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────

    /** Base product query with search/category/status filters applied. */
    private function scopedProducts(ReportFilters $filters): Builder
    {
        return Product::query()
            ->when($filters->categoryId, fn ($q) => $q->where('category_id', $filters->categoryId))
            ->when($filters->search, fn ($q) => $q->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters->search}%")
                  ->orWhere('sku', 'like', "%{$filters->search}%")
                  ->orWhere('barcode', 'like', "%{$filters->search}%");
            }))
            ->when($filters->status && $filters->status !== 'all', function ($q) use ($filters) {
                if ($filters->status === 'negative') {
                    $q->where('stock_quantity', '<', 0);
                } else {
                    $q->where('status', $filters->status);
                }
            });
    }

    /** Established cost methodology: last purchase cost, else default cost. */
    private function productCost(Product $p): float
    {
        return (float) ($p->last_purchase_cost ?? $p->default_purchase_cost ?? 0);
    }

    /** Default period: last 30 days when no explicit range is given. */
    private function resolveRange(ReportFilters $filters): array
    {
        return [
            $filters->dateFrom ?: now()->subDays(29)->format('Y-m-d'),
            $filters->dateTo ?: now()->format('Y-m-d'),
        ];
    }

    /** Attention rows for a category of products, unit-aware and truncated. */
    private function attentionRows($collection): array
    {
        return $collection
            ->sortBy('stock_quantity')
            ->take(10)
            ->values()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'sku' => $p->sku,
                'stock_quantity' => $p->stock_quantity,
                'unit' => $p->base_unit_name,
                'low_stock_threshold' => $p->low_stock_threshold,
                'status' => $p->status,
            ])
            ->all();
    }

    /**
     * Period movement derived from the authoritative inventory transaction
     * ledger (purchase/sale/adjustment) plus the returns module.
     */
    private function stockMovement(string $from, string $to, array $productIds, float $closingStock): array
    {
        if (empty($productIds)) {
            return $this->emptyMovement($closingStock);
        }

        $ledger = InventoryTransaction::whereBetween('date', [$from, $to])
            ->whereIn('product_id', $productIds)
            ->selectRaw("
                SUM(CASE WHEN type = 'purchase' THEN quantity ELSE 0 END)      AS purchased,
                SUM(CASE WHEN type = 'sale'     THEN quantity ELSE 0 END)      AS sold,
                SUM(CASE WHEN type IN ('adjustment','damage','consumption')
                    AND COALESCE(reference,'') <> 'INITIAL' THEN quantity ELSE 0 END) AS adjustments
            ")
            ->first();

        $returns = $this->returnTotals($from, $to, $productIds);

        $purchased = (float) ($ledger->purchased ?? 0);
        $sold = abs((float) ($ledger->sold ?? 0));                 // sales stored negative
        $saleReturns = $returns['sale'];
        $purchaseReturns = $returns['purchase'];
        $adjustments = (float) ($ledger->adjustments ?? 0);        // net (damage/consumption negative)

        $net = $purchased - $sold + $saleReturns - $purchaseReturns + $adjustments;

        return [
            'opening_stock' => round($closingStock - $net),
            'purchased' => round($purchased),
            'sold' => round($sold),
            'sale_returns' => round($saleReturns),
            'purchase_returns' => round($purchaseReturns),
            'adjustments' => round($adjustments),
            'closing_stock' => round($closingStock),
            'net' => round($net),
        ];
    }

    private function emptyMovement(float $closingStock): array
    {
        return [
            'opening_stock' => round($closingStock),
            'purchased' => 0,
            'sold' => 0,
            'sale_returns' => 0,
            'purchase_returns' => 0,
            'adjustments' => 0,
            'closing_stock' => round($closingStock),
            'net' => 0,
        ];
    }

    /** Returned base-unit quantity for the period from the returns module. */
    private function returnTotals(string $from, string $to, array $productIds): array
    {
        if (empty($productIds)) {
            return ['sale' => 0, 'purchase' => 0];
        }

        $row = DB::table('return_items')
            ->join('returns', 'returns.id', '=', 'return_items.return_id')
            ->whereIn('return_items.product_id', $productIds)
            ->where('returns.status', 'completed')
            ->whereBetween('returns.return_date', [$from, $to])
            ->selectRaw("
                SUM(CASE WHEN returns.type = 'SALE'     THEN return_items.base_quantity ELSE 0 END) AS sale,
                SUM(CASE WHEN returns.type = 'PURCHASE' THEN return_items.base_quantity ELSE 0 END) AS purchase
            ")
            ->first();

        return [
            'sale' => (float) ($row->sale ?? 0),
            'purchase' => (float) ($row->purchase ?? 0),
        ];
    }

    /** Top selling products by base-unit quantity in the period. */
    private function topSelling(string $from, string $to, array $productIds, int $limit): array
    {
        if (empty($productIds)) {
            return [];
        }

        return DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->whereIn('sale_items.product_id', $productIds)
            ->whereBetween('sales.date', [$from, $to])
            ->select(
                'sale_items.product_id',
                'sale_items.product_name',
                DB::raw('SUM(sale_items.base_quantity) AS qty'),
                DB::raw('SUM(sale_items.total) AS revenue'),
                DB::raw('COUNT(DISTINCT sale_items.sale_id) AS invoice_count')
            )
            ->groupBy('sale_items.product_id', 'sale_items.product_name')
            ->orderByDesc('qty')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /** Most returned products by base-unit quantity in the period. */
    private function mostReturned(string $from, string $to, array $productIds, int $limit): array
    {
        if (empty($productIds)) {
            return [];
        }

        return DB::table('return_items')
            ->join('returns', 'returns.id', '=', 'return_items.return_id')
            ->whereIn('return_items.product_id', $productIds)
            ->where('returns.status', 'completed')
            ->whereBetween('returns.return_date', [$from, $to])
            ->select(
                'return_items.product_id',
                'return_items.product_name',
                DB::raw('SUM(return_items.base_quantity) AS qty'),
                DB::raw('SUM(return_items.total) AS value'),
                DB::raw('COUNT(DISTINCT return_items.return_id) AS return_count')
            )
            ->groupBy('return_items.product_id', 'return_items.product_name')
            ->orderByDesc('qty')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /** Per-product sold/purchased/returns for a page of products. */
    private function periodStatsByProduct(string $from, string $to, array $productIds): array
    {
        $stats = [];
        if (empty($productIds)) {
            return $stats;
        }

        $rows = InventoryTransaction::whereBetween('date', [$from, $to])
            ->whereIn('product_id', $productIds)
            ->select('product_id', 'type', 'quantity')
            ->get();

        foreach ($rows as $r) {
            $stats[$r->product_id] ??= ['sold' => 0, 'purchased' => 0, 'returns' => 0];
            if ($r->type === 'sale') {
                $stats[$r->product_id]['sold'] += abs((float) $r->quantity);
            } elseif ($r->type === 'purchase') {
                $stats[$r->product_id]['purchased'] += (float) $r->quantity;
            } elseif (in_array($r->type, ['sale-return', 'purchase-return', 'return'], true)) {
                $stats[$r->product_id]['returns'] += (float) $r->quantity;
            }
        }

        return $stats;
    }
}
