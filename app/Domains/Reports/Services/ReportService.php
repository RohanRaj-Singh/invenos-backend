<?php

namespace App\Domains\Reports\Services;

use App\Models\FinancialTransaction;
use App\Models\Expense;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\PurchaseBill;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function getSalesReport(string $from, string $to, ?int $customerId = null): array
    {
        $sales = Sale::where('invoice_number', 'not like', 'RET-%')
            ->when($customerId, fn($q) => $q->where('customer_id', $customerId))
            ->whereBetween('date', [$from, $to])->get();

        $returns = Sale::where('invoice_number', 'like', 'RET-%')
            ->whereBetween('date', [$from, $to])->sum('grand_total');

        $topProducts = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.date', [$from, $to])
            ->where('sales.invoice_number', 'not like', 'RET-%')
            ->select('sale_items.product_name', DB::raw('SUM(sale_items.base_quantity) as total_qty'), DB::raw('SUM(sale_items.total) as total_revenue'))
            ->groupBy('sale_items.product_name')->orderBy('total_revenue', 'desc')->limit(10)->get();

        return [
            'summary' => [
                'total_sales' => $sales->count(),
                'total_revenue' => round($sales->sum('grand_total')),
                'total_paid' => round($sales->sum('amount_paid')),
                'total_discount' => round($sales->sum('discount')),
                'total_returns' => round($returns),
                'net_revenue' => round($sales->sum('grand_total') - $returns),
                'average_order' => $sales->count() > 0 ? round($sales->sum('grand_total') / $sales->count()) : 0,
            ],
            'top_products' => $topProducts,
        ];
    }

    public function getPurchaseReport(string $from, string $to, ?int $supplierId = null): array
    {
        $bills = PurchaseBill::where('invoice_ref', 'not like', 'PRET-%')
            ->when($supplierId, fn($q) => $q->where('supplier_id', $supplierId))
            ->whereBetween('date', [$from, $to])->get();

        $returns = PurchaseBill::where('invoice_ref', 'like', 'PRET-%')
            ->whereBetween('date', [$from, $to])->sum('total_amount');

        return [
            'total_purchases' => $bills->count(),
            'total_value' => round($bills->sum('total_amount')),
            'total_paid' => round($bills->sum('amount_paid')),
            'total_returns' => round($returns),
            'net_purchases' => round($bills->sum('total_amount') - $returns),
            'average_purchase' => $bills->count() > 0 ? round($bills->sum('total_amount') / $bills->count()) : 0,
        ];
    }

    public function getInventoryReport(): array
    {
        $products = Product::with('sellingUnits')->get();
        $totalValue = 0;
        $byCategory = [];

        foreach ($products as $p) {
            $cost = $p->sellingUnits->min('sale_price') ?? 0;
            $value = $p->stock_quantity * $cost;
            $totalValue += $value;
            $cat = $p->category?->name ?? 'Uncategorized';
            if (!isset($byCategory[$cat])) $byCategory[$cat] = ['category' => $cat, 'products' => 0, 'value' => 0];
            $byCategory[$cat]['products']++;
            $byCategory[$cat]['value'] += round($value);
        }

        return [
            'total_products' => $products->count(),
            'total_stock' => round($products->sum('stock_quantity')),
            'low_stock' => $products->where('status', 'low-stock')->count(),
            'out_of_stock' => $products->where('status', 'out-of-stock')->count(),
            'total_value' => round($totalValue),
            'by_category' => array_values($byCategory),
            'recent_movements' => InventoryTransaction::with('product')->orderBy('created_at', 'desc')->limit(20)->get(),
        ];
    }

    public function getFinancialReport(): array
    {
        return [
            'outstanding_receivables' => round(Sale::where('outstanding_balance', '>', 0)->sum('outstanding_balance')),
            'outstanding_payables' => round(PurchaseBill::where('outstanding_balance', '>', 0)->sum('outstanding_balance')),
            'total_collections' => round(FinancialTransaction::where('type', 'collection')->sum('amount')),
            'total_payouts' => round(FinancialTransaction::where('type', 'payout')->sum('amount')),
            'net_cash_flow' => round(FinancialTransaction::where('type', 'collection')->sum('amount') - FinancialTransaction::where('type', 'payout')->sum('amount')),
            'payment_breakdown' => [
                'paid' => Sale::where('payment_status', 'paid')->count(),
                'partial' => Sale::where('payment_status', 'partial')->count(),
                'unpaid' => Sale::where('payment_status', 'unpaid')->count(),
            ],
        ];
    }

    public function getProfitReport(string $from, string $to): array
    {
        $revenue = Sale::where('invoice_number', 'not like', 'RET-%')->whereBetween('date', [$from, $to])->sum('grand_total');
        $returns = Sale::where('invoice_number', 'like', 'RET-%')->whereBetween('date', [$from, $to])->sum('grand_total');
        $netRevenue = $revenue - $returns;

        $cogs = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.date', [$from, $to])
            ->where('sales.invoice_number', 'not like', 'RET-%')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->select(DB::raw('SUM(sale_items.base_quantity * COALESCE((SELECT MIN(sale_price) FROM selling_units WHERE product_id = products.id), 0)) as cogs'))
            ->value('cogs') ?? 0;

        $grossProfit = $netRevenue - (float) $cogs;
        $margin = $netRevenue > 0 ? round(($grossProfit / $netRevenue) * 100, 1) : 0;

        return [
            'revenue' => round($revenue),
            'sale_returns' => round($returns),
            'net_revenue' => round($netRevenue),
            'cogs' => round($cogs),
            'gross_profit' => round($grossProfit),
            'gross_margin_pct' => $margin,
        ];
    }

    public function getDashboardMetrics(): array
    {
        $today = now()->format('Y-m-d');
        $month = now()->format('Y-m');

        $todaySales = Sale::whereDate('date', $today)->where('invoice_number', 'not like', 'RET-%')->sum('grand_total');
        $todayReturns = Sale::whereDate('date', $today)->where('invoice_number', 'like', 'RET-%')->sum('grand_total');
        $todayPurchases = PurchaseBill::whereDate('date', $today)->where('invoice_ref', 'not like', 'PRET-%')->sum('total_amount');
        $todayExpenses = Expense::whereDate('date', $today)->sum('amount');
        $monthExpenses = Expense::where('date', 'like', "{$month}%")->sum('amount');

        return [
            'today_sales' => round($todaySales),
            'today_returns' => round($todayReturns),
            'today_net_sales' => round($todaySales - $todayReturns),
            'today_purchases' => round($todayPurchases),
            'today_expenses' => round($todayExpenses),
            'month_sales' => round(Sale::where('date', 'like', "{$month}%")->where('invoice_number', 'not like', 'RET-%')->sum('grand_total')),
            'month_expenses' => round($monthExpenses),
            'low_stock_items' => Product::whereIn('status', ['low-stock', 'out-of-stock'])->count(),
            'outstanding_receivables' => round(Sale::where('outstanding_balance', '>', 0)->sum('outstanding_balance')),
            'recent_sales' => Sale::with('customer')->where('invoice_number', 'not like', 'RET-%')->orderBy('created_at', 'desc')->limit(5)->get(),
        ];
    }
}
