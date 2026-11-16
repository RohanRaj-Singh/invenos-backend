<?php

namespace Tests\Feature\Products;

use App\Domains\Products\DTOs\CreateProductData;
use App\Domains\Products\Services\ProductService;
use App\Models\Category;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductsTest extends TestCase
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

    public function test_can_create_product(): void
    {
        $data = CreateProductData::fromRequest([
            'name' => 'Test Product',
            'sku' => 'TST-' . uniqid(),
            'base_unit_id' => 'piece',
        ]);
        $service = app(ProductService::class);
        $product = $service->create($data);
        $this->assertDatabaseHas('products', ['sku' => $product->sku]);
    }

    public function test_can_create_with_selling_units(): void
    {
        $data = CreateProductData::fromRequest([
            'name' => 'Multi Unit',
            'sku' => 'MUL-' . uniqid(),
            'base_unit_id' => 'piece',
            'selling_units' => [
                ['name' => 'Strip', 'sale_price' => 100, 'quantity' => 10],
            ],
        ]);
        $service = app(ProductService::class);
        $product = $service->create($data);
        $this->assertEquals(1, $product->sellingUnits()->count());
    }

    public function test_can_search(): void
    {
        Product::create(['name' => 'Searchable', 'sku' => 'SCH-' . uniqid(), 'base_unit_id' => 'piece']);
        $service = app(ProductService::class);
        $results = $service->search(query: 'Searchable');
        $this->assertEquals(1, $results->total());
    }

    public function test_can_delete(): void
    {
        $product = Product::create(['name' => 'Delete Me', 'sku' => 'DEL-' . uniqid(), 'base_unit_id' => 'piece']);
        $service = app(ProductService::class);
        $service->delete($product->id);
        $this->assertSoftDeleted($product);
    }

    public function test_http_create(): void
    {
        $response = $this->actingAs($this->admin())->post('/inventory', [
            'name' => 'HTTP Product',
            'sku' => 'HTTP-' . uniqid(),
            'base_unit_id' => 'piece',
        ]);
        $response->assertSessionHas('success');
    }

    public function test_http_update_cannot_change_stock(): void
    {
        $product = Product::create([
            'name' => 'Locked Stock',
            'sku' => 'LOCK-' . uniqid(),
            'base_unit_id' => 'piece',
            'stock_quantity' => 10,
            'status' => 'in-stock',
        ]);

        $movements = InventoryTransaction::where('product_id', $product->id)->count();

        $this->actingAs($this->admin())
            ->put("/inventory/product/{$product->id}", [
                'name' => 'Renamed Product',
                'sku' => $product->sku,
                'base_unit_id' => 'piece',
                'stock_quantity' => 999,
            ])
            ->assertRedirect();

        $product->refresh();

        $this->assertSame(10.0, (float) $product->stock_quantity);
        $this->assertSame('Renamed Product', $product->name);
        $this->assertSame(
            $movements,
            InventoryTransaction::where('product_id', $product->id)->count()
        );
    }
}
