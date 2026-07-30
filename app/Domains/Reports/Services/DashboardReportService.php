<?php

namespace App\Domains\Reports\Services;

use App\Models\Expense;
use App\Models\Product;
use App\Models\PurchaseBill;
use App\Models\ReturnModel;
use App\Models\Sale;

class DashboardReportService
{
    /**
     * Today's summary metrics.
     */
    public function today(): array
    {
        $today = now()->format('Y-m-d');
        $month = now()->format('Y-m');

        $todaySales = Sale::whereDate('date', $today)->sum('grand_total');
        $todayReturns = ReturnModel::where('type', 'SALE')
            ->where('status', 'completed')
            ->whereDate('return_date', $today)
            ->sum('grand_total');
        $todayPurchases = PurchaseBill::whereDate('date', $today)->sum('total_amount');
        $todayExpenses = Expense::whereDate('date', $today)->sum('amount');

        return [
            'today_sales' => round($todaySales),
            'today_returns' => round($todayReturns),
            'today_net_sales' => round($todaySales - $todayReturns),
            'today_purchases' => round($todayPurchases),
            'today_expenses' => round($todayExpenses),
            'month_sales' => round(Sale::where('date', 'like', "{$month}%")->sum('grand_total')),
            'month_expenses' => round(Expense::where('date', 'like', "{$month}%")->sum('amount')),
            'low_stock_items' => Product::whereIn('status', ['low-stock', 'out-of-stock'])->count(),
            'outstanding_receivables' => round(Sale::where('outstanding_balance', '>', 0)->sum('outstanding_balance')),
            'recent_sales' => Sale::with('customer')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(),
        ];
    }

    /**
     * Quick comparison: today vs yesterday.
     */
    public function trends(): array
    {
        $today = now()->format('Y-m-d');
        $yesterday = now()->subDay()->format('Y-m-d');

        $todaySales = Sale::whereDate('date', $today)->sum('grand_total');
        $yesterdaySales = Sale::whereDate('date', $yesterday)->sum('grand_total');

        $changePct = $yesterdaySales > 0
            ? round((($todaySales - $yesterdaySales) / $yesterdaySales) * 100, 1)
            : 0;

        return [
            'today_sales' => round($todaySales),
            'yesterday_sales' => round($yesterdaySales),
            'change_pct' => $changePct,
            'trend' => $changePct >= 0 ? 'up' : 'down',
        ];
    }
}
