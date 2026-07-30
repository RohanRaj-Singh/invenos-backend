<?php

namespace App\Domains\Reports\Services;

use App\Domains\Reports\DTOs\ReportFilters;
use App\Models\Sale;
use App\Models\ReturnModel;
use Illuminate\Support\Facades\DB;

class SalesReportService
{
    /**
     * Sales Register — all sales within date range, paginated.
     */
    public function register(ReportFilters $filters): array
    {
        $query = Sale::with('customer')
            ->whereBetween('date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->when($filters->contactId, fn($q) => $q->where('customer_id', $filters->contactId))
            ->when($filters->status, fn($q) => $q->where('payment_status', $filters->status))
            ->orderBy($filters->sortBy, $filters->sortDir);

        $sales = $filters->perPage ? $query->paginate($filters->perPage) : $query->get();

        // Get completed sale returns for the period
        $returnsTotal = ReturnModel::where('type', 'SALE')
            ->where('status', 'completed')
            ->whereBetween('return_date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->when($filters->contactId, fn($q) => $q->where('contact_id', $filters->contactId))
            ->sum('grand_total');

        $allSales = Sale::whereBetween('date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->when($filters->contactId, fn($q) => $q->where('customer_id', $filters->contactId))
            ->get();

        return [
            'sales' => $filters->perPage ? $sales->items() : $sales,
            'meta' => $filters->perPage ? [
                'current_page' => $sales->currentPage(),
                'last_page' => $sales->lastPage(),
                'per_page' => $sales->perPage(),
                'total' => $sales->total(),
            ] : null,
            'summary' => [
                'total_sales' => $allSales->count(),
                'total_revenue' => round($allSales->sum('grand_total')),
                'total_paid' => round($allSales->sum('amount_paid')),
                'total_discount' => round($allSales->sum('discount')),
                'total_returns' => round($returnsTotal),
                'net_revenue' => round($allSales->sum('grand_total') - $returnsTotal),
                'average_order' => $allSales->count() > 0 ? round($allSales->sum('grand_total') / $allSales->count()) : 0,
            ],
        ];
    }

    /**
     * Sales by Customer — aggregated per contact.
     */
    public function byCustomer(ReportFilters $filters): array
    {
        $sales = Sale::selectRaw('
                customer_id,
                customer_name,
                COUNT(*) as invoice_count,
                SUM(grand_total) as total_revenue,
                SUM(amount_paid) as total_paid,
                SUM(discount) as total_discount
            ')
            ->whereBetween('date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->whereNotNull('customer_id')
            ->groupBy('customer_id', 'customer_name')
            ->orderByDesc('total_revenue')
            ->get();

        return ['rows' => $sales];
    }

    /**
     * Top Selling Products — aggregated from sale items.
     */
    public function topProducts(ReportFilters $filters): array
    {
        $products = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->select(
                'sale_items.product_id',
                'sale_items.product_name',
                DB::raw('SUM(sale_items.base_quantity) as total_qty'),
                DB::raw('SUM(sale_items.total) as total_revenue'),
                DB::raw('COUNT(DISTINCT sales.id) as invoice_count')
            )
            ->groupBy('sale_items.product_id', 'sale_items.product_name')
            ->orderByDesc('total_revenue')
            ->limit(50)
            ->get();

        return ['products' => $products];
    }

    /**
     * Sale Returns — all completed sale returns in date range.
     */
    public function returns(ReportFilters $filters): array
    {
        $returns = ReturnModel::with(['contact', 'reference', 'reason'])
            ->where('type', 'SALE')
            ->where('status', 'completed')
            ->whereBetween('return_date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->when($filters->contactId, fn($q) => $q->where('contact_id', $filters->contactId))
            ->orderBy('return_date', 'desc')
            ->get();

        return [
            'returns' => $returns,
            'total' => round($returns->sum('grand_total')),
            'count' => $returns->count(),
        ];
    }

    /**
     * Net Sales — gross sales minus returns.
     */
    public function netSales(ReportFilters $filters): array
    {
        $gross = Sale::whereBetween('date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->sum('grand_total');

        $returns = ReturnModel::where('type', 'SALE')
            ->where('status', 'completed')
            ->whereBetween('return_date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->sum('grand_total');

        return [
            'gross_sales' => round($gross),
            'returns' => round($returns),
            'net_sales' => round($gross - $returns),
        ];
    }

    /**
     * Profit Report — revenue, COGS (from actual cost data), gross margin.
     */
    public function profit(ReportFilters $filters): array
    {
        $grossRevenue = Sale::whereBetween('date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->sum('grand_total');

        $returns = ReturnModel::where('type', 'SALE')
            ->where('status', 'completed')
            ->whereBetween('return_date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->sum('grand_total');

        $netRevenue = (float) $grossRevenue - (float) $returns;

        // COGS from sale_items.cost_price �� the actual cost data stored per line item
        $cogs = (float) DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->select(DB::raw('SUM(sale_items.base_quantity * COALESCE(sale_items.cost_price, 0)) as cogs'))
            ->value('cogs') ?? 0;

        $grossProfit = $netRevenue - $cogs;
        $margin = $netRevenue > 0 ? round(($grossProfit / $netRevenue) * 100, 1) : 0;

        return [
            'revenue' => round($grossRevenue),
            'sale_returns' => round($returns),
            'net_revenue' => round($netRevenue),
            'cogs' => round($cogs),
            'gross_profit' => round($grossProfit),
            'gross_margin_pct' => $margin,
        ];
    }
}
