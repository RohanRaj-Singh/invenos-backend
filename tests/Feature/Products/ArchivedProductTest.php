<?php

namespace Tests\Feature\Products;

use App\Domains\Inventory\Services\InventoryService;
use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\DTOs\CreateSaleReturnData;
use App\Domains\Sales\DTOs\SaleItemData;
use App\Domains\Sales\DTOs\SaleReturnItemData;
use App\Domains\Sales\Services\SaleReturnService;
use App\Domains\Sales\Services\SaleService;
use App\Models\Contact;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SellingUnit;
use App\Models\User;
use App\Services\Lifecycle\RecordLifecycleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

/**
 * Archiving hides a product from every listing, picker, report and total — an
 * archived product must never look available — while history, returns and the
 * product's own page keep working so it can be unarchived.
 */
class ArchivedProductTest extends TestCase
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

    private function product(array $attributes = []): Product
    {
        $product = Product::create(array_merge([
            'name' => 'Product',
            'sku' => 'ARC-' . uniqid(),
            'base_unit_id' => 'piece',
            'stock_quantity' => 20,
        ], $attributes));

        SellingUnit::create([
            'product_id' => $product->id,
            'name' => 'Single',
            'unit_id' => 'piece',
            'quantity' => 1,
            'sale_price' => 100,
            'is_default' => true,
        ]);

        return $product;
    }

    private function customer(): Contact
    {
        return Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'C', 'phone' => '0300-111']);
    }

    private function archive(Product $product, ?User $user = null): void
    {
        app(RecordLifecycleService::class)->archive($product, 'discontinued', $user ?? $this->admin());
    }

    // ─── Default exclusion ─────────────────────────────────────

    public function test_archived_products_are_hidden_from_product_queries_by_default(): void
    {
        $live = $this->product();
        $archived = $this->product();
        $this->archive($archived);

        $this->assertSame([$live->id], Product::query()->pluck('id')->all());
        $this->assertNull(Product::find($archived->id));

        $this->assertEqualsCanonicalizing(
            [$live->id, $archived->id],
            Product::withArchived()->pluck('id')->all()
        );
        $this->assertNotNull(Product::withArchived()->find($archived->id));
    }

    public function test_archived_products_are_excluded_from_the_inventory_list(): void
    {
        $admin = $this->admin();
        $live = $this->product();
        $archived = $this->product();
        $this->archive($archived, $admin);

        $this->actingAs($admin)
            ->get('/inventory')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('inventory/ProductList')
                ->where('filters.archived', 'active')
                ->where('products', fn ($products) => collect($products)->pluck('id')->all() === [$live->id]));
    }

    public function test_the_archived_filter_reveals_archived_products(): void
    {
        $admin = $this->admin();
        $this->product();
        $archived = $this->product();
        $this->archive($archived, $admin);

        $this->actingAs($admin)
            ->get('/inventory?archived=archived')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('filters.archived', 'archived')
                ->where('products', fn ($products) => collect($products)->pluck('id')->all() === [$archived->id]));

        $this->actingAs($admin)
            ->get('/inventory?archived=all')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('products', fn ($products) => count($products) === 2));
    }

    public function test_archived_products_are_excluded_from_low_stock(): void
    {
        $admin = $this->admin();
        $archived = $this->product(['sku' => 'OLD-' . uniqid(), 'stock_quantity' => 1, 'status' => 'low-stock']);
        $live = $this->product(['sku' => 'LIV-' . uniqid(), 'stock_quantity' => 1, 'status' => 'low-stock']);
        $this->archive($archived, $admin);

        $ids = collect(app(InventoryService::class)->getLowStock())->pluck('id');

        $this->assertTrue($ids->contains($live->id));
        $this->assertFalse($ids->contains($archived->id));
    }

    // ─── Still reachable on purpose ────────────────────────────

    public function test_an_archived_products_page_still_loads_so_it_can_be_unarchived(): void
    {
        $admin = $this->admin();
        $product = $this->product();
        $this->archive($product, $admin);

        $this->actingAs($admin)
            ->get("/inventory/product/{$product->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('inventory/ProductDetails')
                ->where('lifecycle.can_unarchive', true)
                ->where('lifecycle.can_archive', false));
    }

    public function test_a_product_can_be_unarchived_and_returns_to_the_list(): void
    {
        $admin = $this->admin();
        $product = $this->product();
        $lifecycle = app(RecordLifecycleService::class);

        $lifecycle->archive($product, 'discontinued', $admin);
        $this->assertNotNull($product->fresh()->archived_at);

        $lifecycle->unarchive($product, 'selling again', $admin);

        $fresh = $product->fresh();
        $this->assertNull($fresh->archived_at);
        $this->assertNull($fresh->archive_reason);

        $this->actingAs($admin)
            ->get('/inventory')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('products', fn ($products) => collect($products)->pluck('id')->contains($product->id)));
    }

    // ─── Server-side guards ────────────────────────────────────

    public function test_an_archived_product_cannot_be_added_to_a_sale(): void
    {
        $product = $this->product();
        $this->archive($product);
        $customer = $this->customer();

        $this->expectException(ValidationException::class);

        app(SaleService::class)->create(new CreateSaleData(
            'INV-ARC-' . uniqid(), $customer->id, 'C', '2026-07-26',
            [new SaleItemData($product->id, 'Archived', 1, 1, 1, 100, 100, 'Piece', 0, 'General')],
            0, 100, 'cash', 'paid', 'pos', null, 'Test'
        ));
    }

    public function test_stock_cannot_be_adjusted_for_an_archived_product(): void
    {
        $admin = $this->admin();
        $product = $this->product();
        $this->archive($product, $admin);

        $this->actingAs($admin)
            ->post('/inventory/adjust', [
                'product_id' => $product->id,
                'type' => 'adjustment',
                'quantity' => 5,
            ])
            ->assertSessionHasErrors('product_id');
    }

    // ─── Returns must keep working ─────────────────────────────

    public function test_a_sale_return_still_works_for_an_archived_product(): void
    {
        $customer = $this->customer();
        $product = $this->product();

        $sale = Sale::create([
            'invoice_number' => 'INV-SR-' . uniqid(), 'date' => '2026-07-26',
            'customer_id' => $customer->id, 'customer_name' => 'C',
            'subtotal' => 200, 'grand_total' => 200, 'amount_paid' => 200,
            'outstanding_balance' => 0, 'payment_status' => 'paid', 'created_by' => 'Test',
        ]);
        $sale->items()->create([
            'product_id' => $product->id, 'product_name' => $product->name,
            'packaging_quantity' => 2, 'base_unit_quantity' => 1, 'base_quantity' => 2,
            'unit_price' => 100, 'total' => 200, 'category' => 'General',
        ]);

        $this->archive($product);

        $return = app(SaleReturnService::class)->create(new CreateSaleReturnData(
            'RET-' . uniqid(), '2026-07-27', $sale->id,
            [new SaleReturnItemData($product->id, $product->name, 1, 100, 100, 'defective', 'damaged', true)],
            100, 'cash', 'Test'
        ));

        $this->assertDatabaseHas('sales', ['id' => $return->id]);
        $this->assertEquals(21, $product->fresh()->stock_quantity);
    }
}
