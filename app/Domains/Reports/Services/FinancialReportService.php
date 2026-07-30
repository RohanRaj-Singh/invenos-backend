<?php

namespace App\Domains\Reports\Services;

use App\Domains\Reports\DTOs\ReportFilters;
use App\Models\Expense;
use App\Models\FinancialTransaction;
use App\Models\PurchaseBill;
use App\Models\ReturnModel;
use App\Models\Sale;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class FinancialReportService
{
    /**
     * Business Financial Overview — not a true accounting report,
     * but a comprehensive view of where the business's money is.
     */
    public function overview(ReportFilters $filters): array
    {
        $from = $filters->dateFrom ?? now()->startOfMonth()->format('Y-m-d');
        $to = $filters->dateTo ?? now()->endOfMonth()->format('Y-m-d');

        // ─── Income ────────────────────────────────────────────
        $totalSales = Sale::whereBetween('date', [$from, $to])->sum('grand_total');
        $saleReturns = ReturnModel::where('type', 'SALE')
            ->where('status', 'completed')
            ->whereBetween('return_date', [$from, $to])
            ->sum('grand_total');
        $netSales = $totalSales - $saleReturns;

        // ─── Expenses ──────────────────────────────────────────
        $totalPurchases = PurchaseBill::whereBetween('date', [$from, $to])->sum('total_amount');
        $purchaseReturns = ReturnModel::where('type', 'PURCHASE')
            ->where('status', 'completed')
            ->whereBetween('return_date', [$from, $to])
            ->sum('grand_total');
        $netPurchases = $totalPurchases - $purchaseReturns;

        $totalExpenses = Expense::whereBetween('date', [$from, $to])->sum('amount');

        // ─── Cost of Goods Sold ─���──────────────────────────────
        $cogs = (float) DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.date', [$from, $to])
            ->select(DB::raw('SUM(sale_items.base_quantity * COALESCE(sale_items.cost_price, 0)) as cogs'))
            ->value('cogs') ?? 0;

        $grossProfit = $netSales - $cogs;
        $netProfit = $grossProfit - $totalExpenses;

        // ─── Cash ──────────────────────────────────────────────
        $cashIn = FinancialTransaction::whereBetween('date', [$from, $to])
            ->where('direction', 'in')->sum('amount');
        $cashOut = FinancialTransaction::whereBetween('date', [$from, $to])
            ->where('direction', 'out')->sum('amount');

        $allCashIn = FinancialTransaction::where('direction', 'in')->sum('amount');
        $allCashOut = FinancialTransaction::where('direction', 'out')->sum('amount');

        // ─── Outstanding ───────────────────────────────────────
        $receivables = Sale::where('outstanding_balance', '>', 0)->sum('outstanding_balance');
        $payables = PurchaseBill::where('outstanding_balance', '>', 0)->sum('outstanding_balance');

        // ─── Inventory Value ────────────────────────────────────
        $products = Product::with('sellingUnits')->get();
        $inventoryValue = 0;
        foreach ($products as $p) {
            $cost = $p->sellingUnits->min('sale_price') ?? 0;
            $inventoryValue += $p->stock_quantity * $cost;
        }

        return [
            'summary' => [
                'total_sales' => round($totalSales),
                'total_purchases' => round($totalPurchases),
                'total_expenses' => round($totalExpenses),
                'sale_returns' => round($saleReturns),
                'purchase_returns' => round($purchaseReturns),
                'cash_balance' => round($allCashIn - $allCashOut),
                'receivables' => round($receivables),
                'payables' => round($payables),
                'inventory_value' => round($inventoryValue),
                'gross_profit' => round($grossProfit),
                'net_profit' => round($netProfit),
                'gross_margin_pct' => $netSales > 0 ? round(($grossProfit / $netSales) * 100, 1) : 0,
            ],
            'income' => [
                'sales' => round($totalSales),
                'sale_returns' => round($saleReturns),
                'net_sales' => round($netSales),
            ],
            'expenses' => [
                'purchases' => round($totalPurchases),
                'purchase_returns' => round($purchaseReturns),
                'net_purchases' => round($netPurchases),
                'operating_expenses' => round($totalExpenses),
                'total_expenses' => round($netPurchases + $totalExpenses),
            ],
            'cash_flow' => [
                'cash_in' => round($cashIn),
                'cash_out' => round($cashOut),
                'net_cash' => round($cashIn - $cashOut),
            ],
            'outstanding' => [
                'receivables' => round($receivables),
                'payables' => round($payables),
                'net_position' => round($receivables - $payables),
            ],
        ];
    }
}
