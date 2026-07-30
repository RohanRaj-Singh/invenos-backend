<?php

namespace App\Domains\Reports\Services;

use App\Domains\Reports\DTOs\ReportFilters;
use App\Models\Expense;
use App\Models\FinancialTransaction;
use App\Models\PurchaseBill;
use App\Models\ReturnModel;
use App\Models\Sale;
use App\Models\InventoryTransaction;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class DayBookReportService
{
    /**
     * Generate the complete day book — the daily executive report.
     *
     * Sections:
     * 1. Today's Performance (KPI cards)
     * 2. Cash Summary (opening balance with breakdown explanation)
     * 3. Today's Highlights (largest sale, purchase, etc.)
     * 4. Business Health (insights, warnings)
     * 5. Chronological Timeline (every event in order)
     * 6. Closing Summary
     */
    public function generate(ReportFilters $filters): array
    {
        $from = $filters->dateFrom ?? now()->startOfDay()->format('Y-m-d');
        $to = $filters->dateTo ?? now()->endOfDay()->format('Y-m-d');

        // ─── Gather all events ──────────────────────────────────
        $events = [];
        $financialEvents = []; // subset that affects money
        $operationalEvents = []; // subset that does not

        // Sales
        Sale::whereBetween('date', [$from, $to])
            ->with('customer')
            ->get()
            ->each(function ($sale) use (&$events, &$financialEvents) {
                $e = [
                    'date' => $sale->date->format('Y-m-d'),
                    'time' => $sale->created_at?->format('H:i') ?? '—',
                    'type' => 'Sale',
                    'ref' => $sale->invoice_number,
                    'description' => "Sale to {$sale->customer_name}",
                    'party' => $sale->customer_name ?? 'Walk-in',
                    'amount' => (float) $sale->grand_total,
                    'user' => $sale->created_by ?? '—',
                    'category' => 'Sale',
                    'is_financial' => true,
                    'route' => "/sales/{$sale->id}",
                ];
                $events[] = $e;
                $financialEvents[] = $e;
            });

        // Sale Returns
        ReturnModel::where('type', 'SALE')
            ->where('status', 'completed')
            ->whereBetween('return_date', [$from, $to])
            ->with('contact', 'reason')
            ->get()
            ->each(function ($ret) use (&$events, &$financialEvents) {
                $e = [
                    'date' => $ret->return_date->format('Y-m-d'),
                    'time' => $ret->created_at?->format('H:i') ?? '��',
                    'type' => 'Sale Return',
                    'ref' => $ret->return_number,
                    'description' => $ret->reason?->label ?? 'Return',
                    'party' => $ret->contact?->name ?? '—',
                    'amount' => (float) $ret->grand_total,
                    'user' => $ret->created_by ?? '—',
                    'category' => 'SaleReturn',
                    'is_financial' => true,
                    'route' => "/returns/{$ret->id}",
                ];
                $events[] = $e;
                $financialEvents[] = $e;
            });

        // Purchases
        PurchaseBill::whereBetween('date', [$from, $to])
            ->with('supplier')
            ->get()
            ->each(function ($bill) use (&$events, &$financialEvents) {
                $e = [
                    'date' => $bill->date->format('Y-m-d'),
                    'time' => $bill->created_at?->format('H:i') ?? '—',
                    'type' => 'Purchase',
                    'ref' => $bill->invoice_ref,
                    'description' => "Purchase from {$bill->supplier_name}",
                    'party' => $bill->supplier_name ?? '—',
                    'amount' => (float) $bill->total_amount,
                    'user' => $bill->created_by ?? '—',
                    'category' => 'Purchase',
                    'is_financial' => true,
                    'route' => "/purchases/{$bill->id}",
                ];
                $events[] = $e;
                $financialEvents[] = $e;
            });

        // Purchase Returns
        ReturnModel::where('type', 'PURCHASE')
            ->where('status', 'completed')
            ->whereBetween('return_date', [$from, $to])
            ->with('contact', 'reason')
            ->get()
            ->each(function ($ret) use (&$events, &$financialEvents) {
                $e = [
                    'date' => $ret->return_date->format('Y-m-d'),
                    'time' => $ret->created_at?->format('H:i') ?? '—',
                    'type' => 'Purchase Return',
                    'ref' => $ret->return_number,
                    'description' => $ret->reason?->label ?? 'Return',
                    'party' => $ret->contact?->name ?? '—',
                    'amount' => (float) $ret->grand_total,
                    'user' => $ret->created_by ?? '��',
                    'category' => 'PurchaseReturn',
                    'is_financial' => true,
                    'route' => "/returns/{$ret->id}",
                ];
                $events[] = $e;
                $financialEvents[] = $e;
            });

        // Expenses
        Expense::whereBetween('date', [$from, $to])
            ->with('category')
            ->get()
            ->each(function ($exp) use (&$events, &$financialEvents) {
                $e = [
                    'date' => $exp->date->format('Y-m-d'),
                    'time' => $exp->created_at?->format('H:i') ?? '—',
                    'type' => 'Expense',
                    'ref' => $exp->expense_number,
                    'description' => $exp->category?->name ?? 'Expense',
                    'party' => $exp->paid_to ?? '—',
                    'amount' => (float) $exp->amount,
                    'user' => $exp->created_by ?? '—',
                    'category' => 'Expense',
                    'is_financial' => true,
                    'route' => "/expenses/{$exp->id}",
                ];
                $events[] = $e;
                $financialEvents[] = $e;
            });

        // Financial Transactions (payments)
        FinancialTransaction::whereBetween('date', [$from, $to])
            ->with('contact')
            ->get()
            ->each(function ($ft) use (&$events, &$financialEvents) {
                $type = $ft->direction === 'in' ? 'Payment Received' : 'Payment Made';
                $e = [
                    'date' => $ft->date->format('Y-m-d'),
                    'time' => $ft->created_at?->format('H:i') ?? '—',
                    'type' => $type,
                    'ref' => $ft->reference ?? '—',
                    'description' => $ft->description ?? $ft->type,
                    'party' => $ft->contact?->name ?? '—',
                    'amount' => (float) $ft->amount,
                    'user' => $ft->created_by ?? '—',
                    'category' => 'Payment',
                    'is_financial' => true,
                    'route' => null,
                ];
                $events[] = $e;
                $financialEvents[] = $e;
            });

        // Stock Adjustments (operational, not financial)
        InventoryTransaction::whereBetween('date', [$from, $to])
            ->where('type', 'adjustment')
            ->with('product')
            ->get()
            ->each(function ($adj) use (&$events, &$operationalEvents) {
                $e = [
                    'date' => $adj->date instanceof \Carbon\Carbon ? $adj->date->format('Y-m-d') : $adj->date,
                    'time' => $adj->created_at?->format('H:i') ?? '—',
                    'type' => 'Stock Adjustment',
                    'ref' => $adj->reference ?? '—',
                    'description' => ($adj->product?->name ?? 'Product') . ' (' . ($adj->quantity > 0 ? '+' . (int)$adj->quantity : (int)$adj->quantity) . ')',
                    'party' => '—',
                    'amount' => 0,
                    'user' => $adj->user ?? '—',
                    'category' => 'Adjustment',
                    'is_financial' => false,
                    'route' => "/inventory/product/{$adj->product_id}",
                ];
                $events[] = $e;
                $operationalEvents[] = $e;
            });

        // Sort chronologically
        usort($events, fn($a, $b) => $a['date'] <=> $b['date'] ?: ($a['time'] <=> $b['time']));

        // ─── Section 2: Today's Performance (KPIs) ─────────────
        $totalSales = collect($financialEvents)->where('category', 'Sale')->sum('amount');
        $totalSaleReturns = collect($financialEvents)->where('category', 'SaleReturn')->sum('amount');
        $totalPurchases = collect($financialEvents)->where('category', 'Purchase')->sum('amount');
        $totalPurchaseReturns = collect($financialEvents)->where('category', 'PurchaseReturn')->sum('amount');
        $totalExpenses = collect($financialEvents)->where('category', 'Expense')->sum('amount');
        $totalPaymentsReceived = collect($financialEvents)->where('category', 'Payment')->where('type', 'Payment Received')->sum('amount');
        $totalPaymentsMade = collect($financialEvents)->where('category', 'Payment')->where('type', 'Payment Made')->sum('amount');

        // COGS from sale_items.cost_price
        $cogs = (float) DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.date', [$from, $to])
            ->select(DB::raw('SUM(sale_items.base_quantity * COALESCE(sale_items.cost_price, 0)) as cogs'))
            ->value('cogs') ?? 0;

        $netSales = $totalSales - $totalSaleReturns;
        $netPurchases = $totalPurchases - $totalPurchaseReturns;
        $grossProfit = $netSales - $cogs;
        $netProfit = $grossProfit - $totalExpenses;

        // ─── Section 3: Cash Summary ────────────────────────────
        $cashInBefore = FinancialTransaction::where('date', '<', $from)
            ->where('direction', 'in')->sum('amount');
        $cashOutBefore = FinancialTransaction::where('date', '<', $from)
            ->where('direction', 'out')->sum('amount');
        $openingCash = $cashInBefore - $cashOutBefore;

        $cashReceived = FinancialTransaction::whereBetween('date', [$from, $to])
            ->where('direction', 'in')->sum('amount');
        $cashPaid = FinancialTransaction::whereBetween('date', [$from, $to])
            ->where('direction', 'out')->sum('amount');
        $closingCash = $openingCash + $cashReceived - $cashPaid;

        // Opening balance explanation
        $openingExplanation = '';
        if ($openingCash >= 0) {
            $openingExplanation = "Opening Balance is based on Rs " . number_format($cashInBefore) . " in total cash received minus Rs " . number_format($cashOutBefore) . " in total cash paid before " . $from . ".";
        } else {
            $openingExplanation = "Historical purchases and expenses exceeded cash inflows by Rs " . number_format(abs($openingCash)) . " before " . $from . ".";
        }

        // ─── Section 4: Today's Highlights ──────────────────────
        $largestSale = collect($financialEvents)->where('category', 'Sale')->sortByDesc('amount')->first();
        $largestPurchase = collect($financialEvents)->where('category', 'Purchase')->sortByDesc('amount')->first();
        $highestExpense = collect($financialEvents)->where('category', 'Expense')->sortByDesc('amount')->first();
        $returnCount = collect($financialEvents)->filter(fn($e) => str_contains($e['type'], 'Return'))->count();
        $paymentCount = collect($financialEvents)->where('category', 'Payment')->count();
        $adjustmentCount = count($operationalEvents);

        // New customers this period
        $newCustomerCount = Sale::whereBetween('date', [$from, $to])
            ->whereNotNull('customer_id')
            ->distinct('customer_id')
            ->count('customer_id');

        $highlights = [
            'largest_sale' => $largestSale ? [
                'amount' => round($largestSale['amount']),
                'ref' => $largestSale['ref'],
                'party' => $largestSale['party'],
                'route' => $largestSale['route'],
            ] : null,
            'largest_purchase' => $largestPurchase ? [
                'amount' => round($largestPurchase['amount']),
                'ref' => $largestPurchase['ref'],
                'party' => $largestPurchase['party'],
                'route' => $largestPurchase['route'],
            ] : null,
            'highest_expense' => $highestExpense ? [
                'amount' => round($highestExpense['amount']),
                'ref' => $highestExpense['ref'],
                'party' => $highestExpense['party'],
                'route' => $highestExpense['route'],
            ] : null,
            'return_count' => $returnCount,
            'payment_count' => $paymentCount,
            'adjustment_count' => $adjustmentCount,
            'new_customers' => $newCustomerCount,
        ];

        // ─── Section 5: Business Health ─────────────────────────
        $yesterday = date('Y-m-d', strtotime($from . ' -1 day'));
        $yesterdaySales = Sale::whereDate('date', $yesterday)->sum('grand_total');
        $salesTrend = $yesterdaySales > 0 ? round((($totalSales - $yesterdaySales) / $yesterdaySales) * 100, 1) : 0;

        $negativeStockProducts = Product::where('stock_quantity', '<', 0)->get();
        $lowStockCount = Product::whereIn('status', ['low-stock', 'out-of-stock'])->count();

        $insights = [];
        $warnings = [];

        // Sales vs yesterday
        if ($totalSales > 0 && $yesterdaySales > 0) {
            if ($salesTrend > 0) {
                $insights[] = ['type' => 'positive', 'icon' => 'up', 'message' => "Sales increased by {$salesTrend}% compared to yesterday."];
            } else {
                $warnings[] = ['type' => 'warning', 'icon' => 'down', 'message' => "Sales decreased by " . abs($salesTrend) . "% compared to yesterday."];
            }
        } elseif ($totalSales > 0 && $yesterdaySales == 0) {
            $insights[] = ['type' => 'positive', 'icon' => 'up', 'message' => "Sales recorded today — no sales yesterday."];
        }

        // Profit
        if ($netProfit >= 0) {
            $insights[] = ['type' => 'positive', 'icon' => 'check', 'message' => "Profit is positive at " . number_format($netProfit) . "."];
        } else {
            $warnings[] = ['type' => 'danger', 'icon' => 'alert', 'message' => "Loss of " . number_format(abs($netProfit)) . " — expenses exceeded gross profit."];
        }

        // Expenses vs gross profit
        if ($totalExpenses > 0 && $grossProfit > 0 && $totalExpenses > $grossProfit) {
            $warnings[] = ['type' => 'danger', 'icon' => 'alert', 'message' => "Expenses (Rs " . number_format($totalExpenses) . ") exceeded gross profit (Rs " . number_format($grossProfit) . ")."];
        }

        // Returns
        if ($returnCount > 0) {
            $warnings[] = ['type' => 'warning', 'icon' => 'return', 'message' => "{$returnCount} return(s) were processed today."];
        }

        // Negative stock
        if ($negativeStockProducts->isNotEmpty()) {
            $names = $negativeStockProducts->take(3)->pluck('name')->join(', ');
            $warnings[] = ['type' => 'danger', 'icon' => 'stock', 'message' => "{$negativeStockProducts->count()} product(s) have negative stock: {$names}" . ($negativeStockProducts->count() > 3 ? '...' : '') . "."];
        }

        // Low stock
        if ($lowStockCount > 0) {
            $warnings[] = ['type' => 'warning', 'icon' => 'stock', 'message' => "{$lowStockCount} product(s) are low or out of stock."];
        }

        // Outstanding receivables
        $outstandingReceivables = Sale::where('outstanding_balance', '>', 0)->sum('outstanding_balance');
        if ($outstandingReceivables > 10000) {
            $warnings[] = ['type' => 'warning', 'icon' => 'money', 'message' => "Outstanding customer payments total Rs " . number_format($outstandingReceivables) . "."];
        }

        $health = [
            'insights' => $insights,
            'warnings' => $warnings,
            'sales_trend_pct' => $salesTrend,
            'yesterday_sales' => round($yesterdaySales),
            'negative_stock_count' => $negativeStockProducts->count(),
        ];

        // ─── Closing Summary ────────────────────────────────────
        $moneyIn = $totalSales + $totalPaymentsReceived;
        $moneyOut = $totalPurchases + $totalExpenses + $totalPaymentsMade;

        $closingSummary = [
            'total_transactions' => count($events),
            'financial_events' => count($financialEvents),
            'operational_events' => count($operationalEvents),
            'total_money_in' => round($moneyIn),
            'total_money_out' => round($moneyOut),
            'closing_balance' => round($closingCash),
            'generated_at' => now()->format('Y-m-d H:i:s'),
        ];


        // --- Trend Comparison ------------------------------
        // Compute the same KPIs for the previous period of equal length
        $periodDays = max(1, (int) ceil((strtotime($to) - strtotime($from)) / 86400) + 1);
        $prevTo = date('Y-m-d', strtotime($from . ' -1 day'));
        $prevFrom = date('Y-m-d', strtotime($prevTo . ' -' . ($periodDays - 1) . ' days'));

        $prevSales = Sale::whereBetween('date', [$prevFrom, $prevTo])->sum('grand_total');
        $prevSaleReturns = ReturnModel::where('type', 'SALE')->where('status', 'completed')
            ->whereBetween('return_date', [$prevFrom, $prevTo])->sum('grand_total');
        $prevNetSales = $prevSales - $prevSaleReturns;
        $prevPurchases = PurchaseBill::whereBetween('date', [$prevFrom, $prevTo])->sum('total_amount');
        $prevExpenses = Expense::whereBetween('date', [$prevFrom, $prevTo])->sum('amount');

        $trends = [
            'net_sales' => ['current' => round($netSales), 'previous' => round($prevNetSales)],
            'total_expenses' => ['current' => round($totalExpenses), 'previous' => round($prevExpenses)],
            'total_purchases' => ['current' => round($netPurchases), 'previous' => round($prevPurchases)],
            'total_sales' => ['current' => round($totalSales), 'previous' => round($prevSales)],
        ];

        return [
            'events' => $events,
            'trends' => $trends,
            'summary' => [
                'total_sales' => round($totalSales),
                'total_sale_returns' => round($totalSaleReturns),
                'net_sales' => round($netSales),
                'total_purchases' => round($totalPurchases),
                'total_purchase_returns' => round($totalPurchaseReturns),
                'net_purchases' => round($netPurchases),
                'total_expenses' => round($totalExpenses),
                'cash_in' => round($cashReceived),
                'cash_out' => round($cashPaid),
                'cogs' => round($cogs),
                'gross_profit' => round($grossProfit),
                'net_profit' => round($netProfit),
                'transaction_count' => count($events),
            ],
            'cash_summary' => [
                'opening_balance' => round($openingCash),
                'opening_explanation' => $openingExplanation,
                'cash_in_before' => round($cashInBefore),
                'cash_out_before' => round($cashOutBefore),
                'cash_received' => round($cashReceived),
                'cash_paid' => round($cashPaid),
                'closing_balance' => round($closingCash),
            ],
            'highlights' => $highlights,
            'health' => $health,
            'closing_summary' => $closingSummary,
        ];
    }
}
