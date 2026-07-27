<?php

namespace Tests\Feature\Sales;

use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\DTOs\SaleItemData;
use App\Domains\Sales\Services\SaleService;
use App\Models\Contact;
use App\Models\Product;
use App\Models\InventoryTransaction;
use App\Models\SellingUnit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalesTest extends TestCase
{
    use RefreshDatabase;

    private function customer(): Contact
    {
        return Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'C1', 'phone' => '0300-1111111']);
    }

    private function product(int $stock = 100): Product
    {
        $p = Product::create(['name' => 'Test', 'sku' => 'TST-' . uniqid(), 'base_unit_id' => 'piece', 'stock_quantity' => $stock, 'track_inventory' => true]);
        SellingUnit::create(['product_id' => $p->id, 'name' => 'Single', 'unit_id' => 'piece', 'quantity' => 1, 'sale_price' => 100, 'is_default' => true]);
        return $p;
    }

    public function test_can_create_sale(): void
    {
        $data = new CreateSaleData('INV-' . uniqid(), $this->customer()->id, 'C1', '2026-07-26',
            [new SaleItemData($this->product()->id, 'Test', 1, 1, 1, 100, 100, 'Piece', 0, 'General')],
            0, 100, 'cash', 'paid', 'pos', null, 'Test');

        $sale = app(SaleService::class)->create($data);
        $this->assertDatabaseHas('sales', ['id' => $sale->id]);
    }

    public function test_sale_decreases_inventory(): void
    {
        $p = $this->product(50);
        app(SaleService::class)->create(new CreateSaleData('INV-D-' . uniqid(), $this->customer()->id, 'C1', '2026-07-26',
            [new SaleItemData($p->id, 'Test', 5, 1, 5, 100, 500, 'Piece', 0, 'General')],
            0, 500, 'cash', 'paid', 'pos', null, 'Test'));

        $p->refresh();
        $this->assertEquals(45, $p->stock_quantity);
        $this->assertEquals(-5, InventoryTransaction::where('product_id', $p->id)->first()->quantity);
    }

    public function test_insufficient_stock_rejected(): void
    {
        $p = $this->product(3);
        $this->expectException(\RuntimeException::class);
        app(SaleService::class)->create(new CreateSaleData('INV-NO-' . uniqid(), $this->customer()->id, 'C1', '2026-07-26',
            [new SaleItemData($p->id, 'Test', 10, 1, 10, 100, 1000, 'Piece', 0, 'General')],
            0, 1000, 'cash', 'paid', 'pos', null, 'Test'));
    }

    public function test_invalid_customer_rejected(): void
    {
        $s = Contact::create(['type' => 'organization', 'roles' => ['supplier'], 'name' => 'S', 'phone' => '0300-2222222']);
        $p = $this->product(10);
        $this->expectException(\InvalidArgumentException::class);
        app(SaleService::class)->create(new CreateSaleData('INV-B-' . uniqid(), $s->id, 'S', '2026-07-26',
            [new SaleItemData($p->id, 'Test', 1, 1, 1, 100, 100, 'Piece', 0, 'General')],
            0, 100, 'cash', 'paid', 'pos', null, 'Test'));
    }

    public function test_search_sales(): void
    {
        $inv = 'INV-SRC-' . uniqid();
        app(SaleService::class)->create(new CreateSaleData($inv, $this->customer()->id, 'C1', '2026-07-26',
            [new SaleItemData($this->product()->id, 'Test', 1, 1, 1, 50, 50, 'Piece', 0, 'General')],
            0, 50, 'cash', 'paid', 'pos', null, 'Test'));
        $this->assertEquals(1, app(SaleService::class)->search(query: $inv)->total());
    }
}
