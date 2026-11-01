<?php

namespace Tests\Feature\Reports;

use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\DTOs\SaleItemData;
use App\Domains\Sales\Services\SaleService;
use App\Models\Contact;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FinancialReportsTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::create([
            'name' => 'Admin', 'username' => 'admin', 'email' => 'admin@test.local',
            'password' => bcrypt('secret'), 'role' => 'admin', 'active' => true,
        ]);
    }

    public function test_preset_resolves_on_the_server_and_round_trips(): void
    {
        $this->actingAs($this->admin())
            ->get('/reports/sales?preset=yesterday')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.preset', 'yesterday')
                ->where('filters.date_from', fn ($v) => is_string($v) && $v !== ''));
    }

    public function test_cash_flow_uses_actual_receipts(): void
    {
        $product = Product::create([
            'name' => 'Capsule', 'sku' => 'CF-1', 'base_unit_id' => 'capsule',
            'track_inventory' => true, 'stock_quantity' => 10, 'average_cost' => 100,
            'status' => 'in-stock', 'created_by' => 'test',
        ]);
        $customer = Contact::create([
            'name' => 'Ali', 'phone' => '0300-1', 'roles' => ['customer'], 'type' => 'person',
            'opening_balance' => 0, 'current_balance' => 0,
        ]);

        app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-CF1',
            customerId: $customer->id,
            customerName: 'Ali',
            date: '2026-10-05',
            items: [SaleItemData::fromArray([
                'product_id' => $product->id,
                'product_name' => 'Capsule',
                'quantity' => 5,
                'base_unit_quantity' => 1,
                'base_quantity' => 5,
                'unit_price' => 100,
                'total' => 500,
            ])],
            discount: 0,
            amountPaid: 300,
            paymentMethod: 'cash',
            paymentStatus: 'partial',
            source: 'pos',
            notes: null,
            createdBy: 'test',
        ));

        $this->actingAs($this->admin())
            ->get('/reports/cash-flow?date_from=2026-10-01&date_to=2026-10-31')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('report.summary.total_in', 300)
                ->where('report.summary.total_out', 0)
                ->where('report.summary.closing_balance', 300));
    }

    public function test_financial_position_balances_from_real_ledgers(): void
    {
        $product = Product::create([
            'name' => 'Capsule', 'sku' => 'BS-1', 'base_unit_id' => 'capsule',
            'track_inventory' => true, 'stock_quantity' => 10, 'average_cost' => 100,
            'status' => 'in-stock', 'created_by' => 'test',
        ]);
        $customer = Contact::create([
            'name' => 'Ali', 'phone' => '0300-2', 'roles' => ['customer'], 'type' => 'person',
            'opening_balance' => 0, 'current_balance' => 0,
        ]);

        app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-BS1',
            customerId: $customer->id,
            customerName: 'Ali',
            date: '2026-10-05',
            items: [SaleItemData::fromArray([
                'product_id' => $product->id,
                'product_name' => 'Capsule',
                'quantity' => 5,
                'base_unit_quantity' => 1,
                'base_quantity' => 5,
                'unit_price' => 100,
                'total' => 500,
            ])],
            discount: 0,
            amountPaid: 300,
            paymentMethod: 'cash',
            paymentStatus: 'partial',
            source: 'pos',
            notes: null,
            createdBy: 'test',
        ));

        $this->actingAs($this->admin())
            ->get('/reports/balance-sheet?date_from=2026-10-01&date_to=2026-10-31')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('report.assets.inventory', 500)
                ->where('report.assets.accounts_receivable', 200)
                ->where('report.assets.cash_and_bank', 300)
                ->where('report.totals.balanced', true));
    }
}
