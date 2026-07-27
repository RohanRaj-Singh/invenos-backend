<?php

namespace Tests\Feature\Dashboard;

use App\Domains\Reports\Services\ReportService;
use App\Models\Contact;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SellingUnit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_report_service_returns_dashboard_metrics(): void
    {
        $c = Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'C', 'phone' => '0300-111']);
        $p = Product::create(['name' => 'P', 'sku' => 'P-' . uniqid(), 'base_unit_id' => 'piece', 'stock_quantity' => 50]);
        SellingUnit::create(['product_id' => $p->id, 'name' => 'S', 'unit_id' => 'piece', 'quantity' => 1, 'sale_price' => 100, 'is_default' => true]);

        Sale::create(['invoice_number' => 'INV-D-' . uniqid(), 'date' => now()->format('Y-m-d'),
            'customer_id' => $c->id, 'customer_name' => 'C',
            'subtotal' => 3000, 'grand_total' => 3000, 'amount_paid' => 3000,
            'outstanding_balance' => 0, 'payment_status' => 'paid', 'created_by' => 'Test']);

        $metrics = app(ReportService::class)->getDashboardMetrics();

        $this->assertArrayHasKey('today_sales', $metrics);
        $this->assertArrayHasKey('low_stock_items', $metrics);
        $this->assertArrayHasKey('recent_sales', $metrics);
        $this->assertArrayHasKey('outstanding_receivables', $metrics);
    }

    public function test_dashboard_metrics_endpoint(): void
    {
        $response = $this->getJson('/api/dashboard/metrics');
        $response->assertOk();
        $response->assertJsonStructure([
            'today_sales', 'today_returns', 'today_net_sales',
            'today_purchases', 'month_sales', 'low_stock_items',
            'outstanding_receivables',
        ]);
    }

    public function test_dashboard_financial_report_has_keys(): void
    {
        $report = app(ReportService::class)->getFinancialReport();
        $this->assertArrayHasKey('outstanding_receivables', $report);
        $this->assertArrayHasKey('net_cash_flow', $report);
        $this->assertArrayHasKey('payment_breakdown', $report);
    }

    public function test_dashboard_inventory_report_has_low_stock(): void
    {
        $report = app(ReportService::class)->getInventoryReport();
        $this->assertArrayHasKey('low_stock', $report);
        $this->assertArrayHasKey('out_of_stock', $report);
        $this->assertArrayHasKey('total_value', $report);
    }
}
