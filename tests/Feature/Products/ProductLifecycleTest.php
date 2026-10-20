<?php

namespace Tests\Feature\Products;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Policies\Lifecycle\ProductPolicy;
use App\Services\Lifecycle\RecordLifecycleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::create([
            'name' => 'Admin',
            'username' => 'admin-' . uniqid(),
            'email' => 'admin-' . uniqid() . '@example.com',
            'password' => 'password',
            'role' => 'admin',
        ]);
    }

    private function product(): Product
    {
        return Product::create([
            'name' => 'Lifecycle Product',
            'sku' => 'LIF-' . uniqid(),
            'base_unit_id' => 'piece',
        ]);
    }

    /** Give the product transaction history by selling one unit of it. */
    private function sell(Product $product): void
    {
        $sale = Sale::create([
            'invoice_number' => 'INV-LIF-' . uniqid(),
            'date' => now()->format('Y-m-d'),
            'subtotal' => 100,
            'grand_total' => 100,
            'created_by' => 'Test',
        ]);

        SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'packaging_quantity' => 1,
            'base_unit_quantity' => 1,
            'base_quantity' => 1,
            'unit_price' => 100,
            'total' => 100,
        ]);
    }

    public function test_delete_is_blocked_when_product_has_transactions(): void
    {
        $product = $this->product();
        $this->sell($product);

        try {
            app(RecordLifecycleService::class)->delete($product, 'duplicate entry', $this->admin());
            $this->fail('Deleting a product with transaction history should have been refused.');
        } catch (\Throwable $e) {
            $this->assertStringContainsString('Archive it instead', $e->getMessage());
        }

        $this->assertNotSoftDeleted($product);
    }

    public function test_delete_succeeds_when_product_has_no_transactions(): void
    {
        $product = $this->product();

        app(RecordLifecycleService::class)->delete($product, 'never sold', $this->admin());

        $this->assertSoftDeleted($product);
    }

    public function test_deleted_product_can_be_restored_from_the_recycle_bin(): void
    {
        $product = $this->product();
        $service = app(RecordLifecycleService::class);

        $service->delete($product, 'never sold', $this->admin());
        $this->assertSoftDeleted($product);

        $service->restore($product, $this->admin());

        $this->assertNotSoftDeleted($product);
        $this->assertNull($product->fresh()->delete_reason);
    }

    public function test_delete_blocker_reports_usage_counts(): void
    {
        $product = $this->product();
        $policy = app(ProductPolicy::class);

        $this->assertNull($policy->deleteBlocker($product));

        $this->sell($product);

        $this->assertSame(['sales' => 1, 'purchases' => 0], $policy->deleteBlocker($product));
    }

    public function test_product_page_tells_the_ui_whether_deletion_is_possible(): void
    {
        $admin = $this->admin();

        $blocked = $this->product();
        $this->sell($blocked);

        $this->actingAs($admin)
            ->get("/inventory/product/{$blocked->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('inventory/ProductDetails')
                ->where('lifecycle.can_delete', false)
                ->where('lifecycle.delete_blocker.sales', 1));

        $deletable = $this->product();

        $this->actingAs($admin)
            ->get("/inventory/product/{$deletable->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('inventory/ProductDetails')
                ->where('lifecycle.can_delete', true)
                ->where('lifecycle.delete_blocker', null));
    }
}
