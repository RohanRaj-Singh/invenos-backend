<?php

namespace Tests\Feature\Database;

use App\Models\Contact;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalesTest extends TestCase
{
    use RefreshDatabase;

    public function test_sale_has_unique_invoice_number(): void
    {
        Sale::create(['invoice_number' => 'INV-UNIQUE-TEST', 'date' => now(), 'subtotal' => 100, 'grand_total' => 100, 'amount_paid' => 100, 'outstanding_balance' => 0, 'payment_status' => 'paid', 'created_by' => 'Test']);
        $this->expectException(QueryException::class);
        Sale::create(['invoice_number' => 'INV-UNIQUE-TEST', 'date' => now(), 'subtotal' => 100, 'grand_total' => 100, 'amount_paid' => 100, 'outstanding_balance' => 0, 'payment_status' => 'paid', 'created_by' => 'Test']);
    }

    public function test_sale_belongs_to_customer(): void
    {
        $customer = Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'C1', 'phone' => '0300-1111111']);
        $sale = Sale::create(['invoice_number' => 'INV-TEST-003', 'date' => now(), 'customer_id' => $customer->id, 'subtotal' => 100, 'grand_total' => 100, 'amount_paid' => 100, 'outstanding_balance' => 0, 'payment_status' => 'paid', 'created_by' => 'Test']);
        $this->assertTrue($sale->customer()->exists());
    }

    public function test_soft_delete_preserves_items(): void
    {
        $product = Product::create(['name' => 'Test Product', 'sku' => 'TST-001', 'base_unit_id' => 'piece']);
        $sale = Sale::create(['invoice_number' => 'INV-TEST-004', 'date' => now(), 'subtotal' => 500, 'grand_total' => 500, 'amount_paid' => 500, 'outstanding_balance' => 0, 'payment_status' => 'paid', 'created_by' => 'Test']);
        $sale->items()->create(['product_id' => $product->id, 'packaging_quantity' => 1, 'base_unit_quantity' => 1, 'base_quantity' => 1, 'unit_price' => 250, 'total' => 250]);
        $sale->items()->create(['product_id' => $product->id, 'packaging_quantity' => 2, 'base_unit_quantity' => 1, 'base_quantity' => 2, 'unit_price' => 125, 'total' => 250]);
        $this->assertEquals(2, $sale->items()->count());

        $sale->delete();

        $this->assertSoftDeleted($sale);
        $this->assertEquals(2, SaleItem::count());
    }

    public function test_force_delete_cascades_items(): void
    {
        $product = Product::create(['name' => 'Test Product', 'sku' => 'TST-002', 'base_unit_id' => 'piece']);
        $sale = Sale::create(['invoice_number' => 'INV-TEST-005', 'date' => now(), 'subtotal' => 250, 'grand_total' => 250, 'amount_paid' => 250, 'outstanding_balance' => 0, 'payment_status' => 'paid', 'created_by' => 'Test']);
        $sale->items()->create(['product_id' => $product->id, 'packaging_quantity' => 1, 'base_unit_quantity' => 1, 'base_quantity' => 1, 'unit_price' => 250, 'total' => 250]);
        $this->assertEquals(1, SaleItem::count());

        $sale->forceDelete();

        $this->assertEquals(0, SaleItem::count());
    }
}
