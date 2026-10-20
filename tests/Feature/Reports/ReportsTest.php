<?php

namespace Tests\Feature\Reports;

use App\Domains\Reports\Services\ReportService;
use App\Models\Contact;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SellingUnit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportsTest extends TestCase
{
    use RefreshDatabase;

    public function test_sales_report_returns_summary(): void
    {
        $c = Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'C', 'phone' => '0300-111']);
        $p = Product::create(['name' => 'P1', 'sku' => 'P1-' . uniqid(), 'base_unit_id' => 'piece', 'stock_quantity' => 50]);
        SellingUnit::create(['product_id' => $p->id, 'name' => 'Single', 'unit_id' => 'piece', 'quantity' => 1, 'sale_price' => 100, 'is_default' => true]);

        Sale::create(['invoice_number' => 'INV-001', 'date' => now()->format('Y-m-d'), 'customer_id' => $c->id, 'customer_name' => 'C',
            'subtotal' => 1000, 'grand_total' => 1000, 'amount_paid' => 1000, 'outstanding_balance' => 0, 'payment_status' => 'paid', 'created_by' => 'Test']);
        Sale::create(['invoice_number' => 'INV-002', 'date' => now()->format('Y-m-d'), 'customer_id' => $c->id, 'customer_name' => 'C',
            'subtotal' => 500, 'grand_total' => 500, 'amount_paid' => 500, 'outstanding_balance' => 0, 'payment_status' => 'paid', 'created_by' => 'Test']);

        $report = app(ReportService::class)->getSalesReport(
            now()->subDays(1)->format('Y-m-d'),
            now()->addDay()->format('Y-m-d')
        );

        $this->assertEquals(2, $report['summary']['total_sales']);
        $this->assertEquals(1500, $report['summary']['total_revenue']);
    }

    public function test_inventory_report_counts(): void
    {
        Product::create(['name' => 'P1', 'sku' => 'A', 'base_unit_id' => 'piece', 'stock_quantity' => 10, 'status' => 'in-stock']);
        Product::create(['name' => 'P2', 'sku' => 'B', 'base_unit_id' => 'piece', 'stock_quantity' => 2, 'status' => 'low-stock']);

        $report = app(ReportService::class)->getInventoryReport();
        $this->assertEquals(2, $report['total_products']);
        $this->assertEquals(1, $report['low_stock']);
    }

    public function test_financial_report_has_keys(): void
    {
        $report = app(ReportService::class)->getFinancialReport();
        $this->assertArrayHasKey('outstanding_receivables', $report);
        $this->assertArrayHasKey('net_cash_flow', $report);
        $this->assertArrayHasKey('payment_breakdown', $report);
    }

    public function test_profit_report_has_metrics(): void
    {
        $c = Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'C', 'phone' => '0300-111']);
        $p = Product::create(['name' => 'P', 'sku' => 'P-' . uniqid(), 'base_unit_id' => 'piece', 'stock_quantity' => 50]);
        SellingUnit::create(['product_id' => $p->id, 'name' => 'S', 'unit_id' => 'piece', 'quantity' => 1, 'sale_price' => 200, 'is_default' => true]);

        Sale::create(['invoice_number' => 'INV-P-' . uniqid(), 'date' => now()->format('Y-m-d'), 'customer_id' => $c->id, 'customer_name' => 'C',
            'subtotal' => 2000, 'grand_total' => 2000, 'amount_paid' => 2000, 'outstanding_balance' => 0, 'payment_status' => 'paid', 'created_by' => 'Test']);

        $r = app(ReportService::class)->getProfitReport(now()->subDay()->format('Y-m-d'), now()->addDay()->format('Y-m-d'));
        $this->assertEquals(2000, $r['revenue']);
        $this->assertArrayHasKey('gross_profit', $r);
    }

    public function test_profit_report_excludes_soft_deleted_sales_from_cogs(): void
    {
        $c = Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'C', 'phone' => '0300-222']);
        $p = Product::create(['name' => 'P', 'sku' => 'P-' . uniqid(), 'base_unit_id' => 'piece', 'stock_quantity' => 100]);

        $makeSale = function (string $invoice) use ($c, $p) {
            $sale = Sale::create(['invoice_number' => $invoice, 'date' => now()->format('Y-m-d'), 'customer_id' => $c->id,
                'customer_name' => 'C', 'subtotal' => 1000, 'grand_total' => 1000, 'amount_paid' => 1000,
                'outstanding_balance' => 0, 'payment_status' => 'paid', 'created_by' => 'Test']);
            SaleItem::create(['sale_id' => $sale->id, 'product_id' => $p->id, 'packaging_quantity' => 10,
                'base_unit_quantity' => 10, 'base_quantity' => 10, 'unit_price' => 100, 'cost_price' => 60, 'total' => 1000]);
            return $sale;
        };

        $makeSale('INV-P-LIVE-' . uniqid());
        $makeSale('INV-P-DEL-' . uniqid())->delete();

        $r = app(ReportService::class)->getProfitReport(now()->subDay()->format('Y-m-d'), now()->addDay()->format('Y-m-d'));

        $this->assertEquals(1000, $r['revenue']);
        $this->assertEquals(600, $r['cogs']);
        $this->assertEquals(400, $r['gross_profit']);
        $this->assertEquals(collect($r['bill_wise'])->sum('cogs'), $r['cogs']);
    }

    public function test_dashboard_metrics_have_keys(): void
    {
        $m = app(ReportService::class)->getDashboardMetrics();
        $this->assertArrayHasKey('today_sales', $m);
        $this->assertArrayHasKey('low_stock_items', $m);
        $this->assertArrayHasKey('recent_sales', $m);
    }
}
