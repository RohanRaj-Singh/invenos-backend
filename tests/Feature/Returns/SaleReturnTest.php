<?php

namespace Tests\Feature\Returns;

use App\Domains\Sales\DTOs\CreateSaleReturnData;
use App\Domains\Sales\DTOs\SaleReturnItemData;
use App\Domains\Sales\Services\SaleReturnService;
use App\Models\Contact;
use App\Models\Product;
use App\Models\SellingUnit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleReturnTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_sale_return(): void
    {
        $customer = Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'C', 'phone' => '0300-111']);
        $product = Product::create(['name' => 'P1', 'sku' => 'P1-' . uniqid(), 'base_unit_id' => 'piece', 'stock_quantity' => 50]);

        // Create original sale
        $sale = \App\Models\Sale::create([
            'invoice_number' => 'INV-ORIG-' . uniqid(), 'date' => '2026-07-26',
            'customer_id' => $customer->id, 'customer_name' => $customer->name,
            'subtotal' => 200, 'grand_total' => 200, 'amount_paid' => 200,
            'outstanding_balance' => 0, 'payment_status' => 'paid', 'created_by' => 'Test',
        ]);
        $sale->items()->create([
            'product_id' => $product->id, 'product_name' => $product->name,
            'packaging_quantity' => 5, 'base_unit_quantity' => 1, 'base_quantity' => 5,
            'unit_price' => 40, 'total' => 200, 'category' => 'General',
        ]);

        $data = new CreateSaleReturnData(
            returnNumber: 'RET-' . uniqid(),
            date: '2026-07-27',
            originalSaleId: $sale->id,
            items: [
                new SaleReturnItemData($product->id, $product->name, 2, 40, 80, 'defective', 'damaged', true),
            ],
            refundTotal: 80,
            refundMethod: 'cash',
            createdBy: 'Test',
        );

        $return = app(SaleReturnService::class)->create($data);

        $this->assertDatabaseHas('sales', ['id' => $return->id]);
        $this->assertStringStartsWith('RET-', $return->invoice_number);
    }

    public function test_sale_return_increases_inventory(): void
    {
        $customer = Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'C', 'phone' => '0300-222']);
        $product = Product::create(['name' => 'P2', 'sku' => 'P2-' . uniqid(), 'base_unit_id' => 'piece', 'stock_quantity' => 30]);

        $sale = \App\Models\Sale::create([
            'invoice_number' => 'INV-SR-' . uniqid(), 'date' => '2026-07-26',
            'customer_id' => $customer->id, 'customer_name' => $customer->name,
            'subtotal' => 100, 'grand_total' => 100, 'amount_paid' => 100,
            'outstanding_balance' => 0, 'payment_status' => 'paid', 'created_by' => 'Test',
        ]);
        $sale->items()->create([
            'product_id' => $product->id, 'product_name' => $product->name,
            'packaging_quantity' => 3, 'base_unit_quantity' => 1, 'base_quantity' => 3,
            'unit_price' => 33, 'total' => 99, 'category' => 'General',
        ]);

        app(SaleReturnService::class)->create(new CreateSaleReturnData(
            'RET-' . uniqid(), '2026-07-27', $sale->id,
            [new SaleReturnItemData($product->id, $product->name, 1, 33, 33, 'defective', 'damaged', true)],
            33, 'cash', 'Test',
        ));

        $product->refresh();
        $this->assertEquals(31, $product->stock_quantity);
    }
}
