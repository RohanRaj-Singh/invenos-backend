<?php

namespace Tests\Feature\Products;

use App\Domains\Products\DTOs\CreateProductData;
use App\Domains\Products\Services\ProductService;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductsTest extends TestCase
{
    use RefreshDatabase;

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
        $response = $this->post('/inventory', [
            'name' => 'HTTP Product',
            'sku' => 'HTTP-' . uniqid(),
            'base_unit_id' => 'piece',
        ]);
        $response->assertSessionHas('success');
    }
}
