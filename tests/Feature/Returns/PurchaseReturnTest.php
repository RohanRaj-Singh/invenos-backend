<?php

namespace Tests\Feature\Returns;

use App\Domains\Purchasing\DTOs\CreatePurchaseReturnData;
use App\Domains\Purchasing\DTOs\PurchaseReturnItemData;
use App\Domains\Purchasing\Services\PurchaseReturnService;
use App\Models\Contact;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseReturnTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_purchase_return(): void
    {
        $supplier = Contact::create(['type' => 'organization', 'roles' => ['supplier'], 'name' => 'S', 'phone' => '0300-111']);
        $product = Product::create(['name' => 'P1', 'sku' => 'P1-' . uniqid(), 'base_unit_id' => 'piece', 'stock_quantity' => 100]);

        $bill = \App\Models\PurchaseBill::create([
            'invoice_ref' => 'PUR-ORIG-' . uniqid(), 'date' => '2026-07-26',
            'supplier_id' => $supplier->id, 'supplier_name' => $supplier->name,
            'subtotal' => 500, 'total_amount' => 500, 'amount_paid' => 500,
            'outstanding_balance' => 0, 'payment_status' => 'paid', 'status' => 'received', 'created_by' => 'Test',
        ]);

        $data = new CreatePurchaseReturnData(
            returnRef: 'PRET-' . uniqid(),
            date: '2026-07-27',
            originalPurchaseId: $bill->id,
            items: [
                new PurchaseReturnItemData($product->id, $product->name, 10, 50, 500, 'resellable', true),
            ],
            refundTotal: 500,
            refundMethod: 'transfer',
            createdBy: 'Test',
        );

        $return = app(PurchaseReturnService::class)->create($data);

        $this->assertDatabaseHas('purchase_bills', ['id' => $return->id]);
        $this->assertStringStartsWith('PRET-', $return->invoice_ref);
    }

    public function test_purchase_return_decreases_inventory(): void
    {
        $supplier = Contact::create(['type' => 'organization', 'roles' => ['supplier'], 'name' => 'S2', 'phone' => '0300-222']);
        $product = Product::create(['name' => 'P2', 'sku' => 'P2-' . uniqid(), 'base_unit_id' => 'piece', 'stock_quantity' => 50]);

        $bill = \App\Models\PurchaseBill::create([
            'invoice_ref' => 'PUR-PR-' . uniqid(), 'date' => '2026-07-26',
            'supplier_id' => $supplier->id, 'supplier_name' => $supplier->name,
            'subtotal' => 200, 'total_amount' => 200, 'amount_paid' => 200,
            'outstanding_balance' => 0, 'payment_status' => 'paid', 'status' => 'received', 'created_by' => 'Test',
        ]);

        app(PurchaseReturnService::class)->create(new CreatePurchaseReturnData(
            'PRET-' . uniqid(), '2026-07-27', $bill->id,
            [new PurchaseReturnItemData($product->id, $product->name, 20, 10, 200, 'resellable', true)],
            200, 'transfer', 'Test',
        ));

        $product->refresh();
        $this->assertEquals(30, $product->stock_quantity);
    }
}
