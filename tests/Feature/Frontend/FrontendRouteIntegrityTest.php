<?php

namespace Tests\Feature\Frontend;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * P12 frontend contract tests: every page an Inertia route renders must exist,
 * and the product/formula entry points must actually resolve.
 */
class FrontendRouteIntegrityTest extends TestCase
{
    use RefreshDatabase;

    /**
     * These tests assert that a page RESOLVES, not that assets were built.
     * Without this, they fail whenever public/build does not contain the newest
     * page — which says nothing about whether the route works.
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'active' => true]);
    }

    public function test_product_and_formula_entry_points_resolve(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->get('/inventory/add')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('inventory/CreateProduct')->where('setup_formula', false));

        $this->actingAs($admin)->get('/inventory/add?formula=1')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('inventory/CreateProduct')->where('setup_formula', true));
    }

    public function test_formula_list_view_resolves(): void
    {
        $this->actingAs($this->admin())
            ->get('/inventory?composition=formula')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('inventory/ProductList'));
    }

    /**
     * Routes that previously rendered page components which did not exist and
     * therefore failed at render time.
     */
    public function test_report_pages_with_missing_components_now_resolve(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->get('/reports/sales/by-customer')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('reports/CustomerSales'));

        $this->actingAs($admin)->get('/reports/sales/top-products')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('reports/TopProducts'));
    }

    /**
     * A page component that does not exist only fails at render time, which a
     * static check misses. Probe the real routes instead.
     */
    public function test_get_pages_render_without_server_errors(): void
    {
        $admin = $this->admin();

        $routes = [
            '/inventory',
            '/inventory/add',
            '/inventory/add?formula=1',
            '/inventory/movements',
            '/inventory/low-stock',
            '/inventory/valuation',
            '/sales',
            '/sales/pos',
            '/sales/returns',
            '/purchases',
            '/purchases/new',
            '/purchases/returns',
            '/payments',
            '/contacts',
            '/expenses',
            '/expenses/new',
            '/expenses/categories',
            '/reports',
            '/settings',
        ];

        $failures = [];

        foreach ($routes as $route) {
            $status = $this->actingAs($admin)->get($route)->getStatusCode();
            // 200 (page), 302 (intentional redirect to the canonical report).
            if (! in_array($status, [200, 302], true)) {
                $failures[] = "{$route} -> {$status}";
            }
        }

        $this->assertSame([], $failures, 'Routes failing to render: '.implode(', ', $failures));
    }

    public function test_every_reachable_report_page_loads(): void
    {
        $admin = $this->admin();

        $routes = [
            '/reports',
            '/reports/day-book',
            '/reports/sales',
            '/reports/purchases',
            '/reports/stock',
            '/reports/stock/ledger',
            '/reports/stock/low-stock',
            '/reports/cash-flow',
            '/reports/financial-overview',
            '/reports/pnl',
            '/reports/balance-sheet',
            '/reports/product-ledger',
            '/reports/party',
            '/reports/component-usage',
        ];

        foreach ($routes as $route) {
            $this->actingAs($admin)->get($route)->assertOk();
        }
    }
}
