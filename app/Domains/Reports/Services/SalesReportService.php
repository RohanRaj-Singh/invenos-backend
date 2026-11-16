<?php

namespace App\Domains\Reports\Services;

use App\Domains\Reports\DTOs\ReportFilters;
use App\Models\Expense;
use App\Models\ReturnModel;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;

class SalesReportService
{
    public function __construct(
        private readonly CogsCalculator $cogs,
    ) {}

    /**
     * Sales Register — all sales within date range, paginated.
     */
    public function register(ReportFilters $filters): array
    {
        $query = Sale::with('customer')
            ->whereBetween('date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->when($filters->contactId, fn ($q) => $q->where('customer_id', $filters->contactId))
            ->when($filters->status, fn ($q) => $q->where('payment_status', $filters->status))
            ->orderBy($filters->sortBy, $filters->sortDir);

        $sales = $filters->perPage ? $query->paginate($filters->perPage) : $query->get();

        // Get completed sale returns for the period
        $returnsTotal = ReturnModel::where('type', 'SALE')
            ->where('status', 'completed')
            ->whereBetween('return_date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->when($filters->contactId, fn ($q) => $q->where('contact_id', $filters->contactId))
            ->sum('grand_total');

        $allSales = Sale::whereBetween('date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->when($filters->contactId, fn ($q) => $q->where('customer_id', $filters->contactId))
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
            ->whereNull('sales.deleted_at')
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
            ->when($filters->contactId, fn ($q) => $q->where('contact_id', $filters->contactId))
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
        $from = $filters->dateFrom ?? '2000-01-01';
        $to = $filters->dateTo ?? now()->format('Y-m-d');

        $grossRevenue = Sale::whereBetween('date', [$from, $to])->sum('grand_total');

        $returns = ReturnModel::where('type', 'SALE')
            ->where('status', 'completed')
            ->whereBetween('return_date', [$from, $to])
            ->sum('grand_total');

        $netRevenue = (float) $grossRevenue - (float) $returns;

        // Returned sale IDs — exclude from COGS to avoid double-penalizing
        $returnedSaleIds = ReturnModel::where('type', 'SALE')
            ->where('status', 'completed')
            ->whereBetween('return_date', [$from, $to])
            ->pluck('reference_id');

        $costSummary = $this->cogs->summary($from, $to);
        $cogs = round($costSummary['cogs'] - $this->cogs->returned($from, $to), 6);
        $returnedByItem = $this->cogs->returnedQuantityByItem($from, $to);

        $grossProfit = $netRevenue - $cogs;
        $margin = $netRevenue > 0 ? round(($grossProfit / $netRevenue) * 100, 1) : 0;

        $totalExpenses = (float) Expense::whereBetween('date', [$from, $to])->sum('amount');
        $netProfit = $grossProfit - $totalExpenses;

        // Bill-wise profit per invoice
        $sales = Sale::with('items')
            ->whereBetween('date', [$from, $to])
            ->orderBy('date', 'desc')
            ->get();

        $lineCosts = $this->cogs->lineCostsForSaleItemIds(
            $sales->flatMap(fn ($sale) => $sale->items->pluck('id'))->all()
        );

        $billWise = $sales->map(function ($sale) use ($returnedSaleIds, $returnedByItem, $lineCosts) {
            $cost = 0.0;
            $costComplete = true;
            $uncostedLines = 0;
            $uncostedSimpleLines = 0;

            foreach ($sale->items as $item) {
                $returnedQty = (float) ($returnedByItem[$item->id] ?? 0);
                $soldQty = max(0, (float) ($item->base_quantity ?? 0) - $returnedQty);
                $line = $lineCosts[(int) $item->id] ?? null;

                if ($line === null) {
                    $cost += $soldQty * (float) ($item->cost_price ?? 0);

                    continue;
                }

                $unitCost = $line['base_quantity'] > 0
                    ? $line['total_cost'] / $line['base_quantity']
                    : 0.0;

                $cost += $soldQty * $unitCost;

                if (! $line['cost_complete']) {
                    $costComplete = false;

                    if ($line['is_composition']) {
                        $uncostedLines += max(1, $line['uncosted_lines']);
                    } else {
                        $uncostedSimpleLines += max(1, $line['uncosted_lines']);
                    }
                }
            }

            $returned = $returnedSaleIds->contains($sale->id);

            return [
                'id' => $sale->id,
                'invoice_number' => $sale->invoice_number,
                'date' => $sale->date,
                'customer_name' => $sale->customer_name ?? 'Walk-in',
                'revenue' => round($sale->grand_total),
                'cogs' => round($cost),
                'profit' => round($sale->grand_total - $cost),
                'margin_pct' => $sale->grand_total > 0 ? round(($sale->grand_total - $cost) / $sale->grand_total * 100, 1) : 0,
                'returned' => $returned,
                'cost_complete' => $costComplete,
                'uncosted_composition_lines' => $uncostedLines,
                'uncosted_simple_lines' => $uncostedSimpleLines,
            ];
        });

        return [
            'revenue' => round($grossRevenue),
            'sale_returns' => round($returns),
            'net_revenue' => round($netRevenue),
            'cogs' => round($cogs),
            'gross_profit' => round($grossProfit),
            'gross_margin_pct' => $margin,
            'total_expenses' => round($totalExpenses),
            'net_profit' => round($netProfit),
            'cost_complete' => $costSummary['cost_complete'],
            'simple_cost_complete' => $costSummary['simple_cost_complete'],
            'uncosted_simple_items' => $costSummary['uncosted_simple_items'],
            'uncosted_simple_lines' => $costSummary['uncosted_simple_lines'],
            'uncosted_composition_items' => $costSummary['uncosted_composition_items'],
            'uncosted_composition_lines' => $costSummary['uncosted_composition_lines'],
            'composition_cost_basis' => $costSummary['composition_cost_basis'],
            'bill_wise' => $billWise,
        ];
    }
}
