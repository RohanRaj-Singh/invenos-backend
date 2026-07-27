<?php

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Services\InventoryService;
use App\Models\Product;
use App\Models\InventoryTransaction;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_overview_returns_counts(): void
    {
        Product::create(['name' => 'P1', 'sku' => 'SKU-1', 'base_unit_id' => 'piece', 'status' => 'in-stock', 'stock_quantity' => 10]);
        Product::create(['name' => 'P2', 'sku' => 'SKU-2', 'base_unit_id' => 'piece', 'status' => 'low-stock', 'stock_quantity' => 3]);

        $service = app(InventoryService::class);
        $overview = $service->getOverview();

        $this->assertEquals(2, $overview['total_products']);
        $this->assertEquals(1, $overview['in_stock']);
        $this->assertEquals(1, $overview['low_stock']);
    }

    public function test_search_filters_by_status(): void
    {
        Product::create(['name' => 'In Stock', 'sku' => 'IN-001', 'base_unit_id' => 'piece', 'status' => 'in-stock', 'stock_quantity' => 10]);
        Product::create(['name' => 'Low', 'sku' => 'LW-001', 'base_unit_id' => 'piece', 'status' => 'low-stock', 'stock_quantity' => 3]);
        Product::create(['name' => 'Out', 'sku' => 'OT-001', 'base_unit_id' => 'piece', 'status' => 'out-of-stock', 'stock_quantity' => 0]);

        $service = app(InventoryService::class);
        $this->assertEquals(1, $service->search(status: 'in-stock')->total());
        $this->assertEquals(1, $service->search(status: 'low-stock')->total());
        $this->assertEquals(1, $service->search(status: 'out-of-stock')->total());
        $this->assertEquals(3, $service->search(status: 'all')->total());
    }

    public function test_movements_returned(): void
    {
        $product = Product::create(['name' => 'Mov', 'sku' => 'MOV-' . uniqid(), 'base_unit_id' => 'piece']);

        InventoryTransaction::create(['product_id' => $product->id, 'type' => 'purchase', 'quantity' => 50, 'unit' => 'piece', 'date' => '2026-07-26', 'reference' => 'REF-001', 'running_balance' => 50]);
        InventoryTransaction::create(['product_id' => $product->id, 'type' => 'sale', 'quantity' => -10, 'unit' => 'piece', 'date' => '2026-07-27', 'reference' => 'REF-002', 'running_balance' => 40]);

        $service = app(InventoryService::class);
        $this->assertEquals(2, $service->getMovements()->total());
        $this->assertEquals(2, $service->getMovements(productId: $product->id)->total());
    }

    public function test_low_stock_returns_critical_items(): void
    {
        Product::create(['name' => 'Critical', 'sku' => 'CRT-' . uniqid(), 'base_unit_id' => 'piece', 'status' => 'low-stock', 'stock_quantity' => 2]);
        Product::create(['name' => 'Out', 'sku' => 'OUT-' . uniqid(), 'base_unit_id' => 'piece', 'status' => 'out-of-stock', 'stock_quantity' => 0]);
        Product::create(['name' => 'Fine', 'sku' => 'FIN-' . uniqid(), 'base_unit_id' => 'piece', 'status' => 'in-stock', 'stock_quantity' => 50]);

        $service = app(InventoryService::class);
        $this->assertEquals(2, count($service->getLowStock()));
    }

    public function test_valuation_returns_data(): void
    {
        $cat = Category::create(['name' => 'Medicine']);
        $product = Product::create(['name' => 'Val P', 'sku' => 'VAL-' . uniqid(), 'base_unit_id' => 'piece', 'stock_quantity' => 10]);
        $product->category_id = $cat->id;
        $product->save();

        $service = app(InventoryService::class);
        $valuation = $service->getValuation();
        $this->assertArrayHasKey('total_value', $valuation);
        $this->assertArrayHasKey('by_category', $valuation);
    }
}
