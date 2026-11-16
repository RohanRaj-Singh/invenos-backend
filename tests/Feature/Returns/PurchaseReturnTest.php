<?php

namespace Tests\Feature\Returns;

use App\Domains\Purchasing\DTOs\CreatePurchaseReturnData;
use App\Domains\Purchasing\Services\PurchaseReturnService;
use App\Domains\Returns\DTOs\ReturnCreateData;
use App\Domains\Returns\DTOs\ReturnItemData;
use App\Domains\Returns\Services\ReturnService;
use App\Models\Contact;
use App\Models\Product;
use App\Models\PurchaseBill;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseReturnTest extends TestCase
{
    use RefreshDatabase;

    public function test_canonical_purchase_return_decreases_inventory(): void
    {
        $supplier = Contact::create(['type' => 'organization', 'roles' => ['supplier'], 'name' => 'S', 'phone' => '0300-111']);
        $product = Product::create(['name' => 'P1', 'sku' => 'P1-' . uniqid(), 'base_unit_id' => 'piece', 'stock_quantity' => 40]);

        $bill = PurchaseBill::create([
            'invoice_ref' => 'PUR-ORIG-' . uniqid(), 'date' => '2026-07-26',
            'supplier_id' => $supplier->id, 'supplier_name' => $supplier->name,
            'subtotal' => 100, 'total_amount' => 100, 'amount_paid' => 100,
            'outstanding_balance' => 0, 'payment_status' => 'paid', 'status' => 'received', 'created_by' => 'Test',
        ]);
        $item = $bill->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'base_unit_id' => 'piece',
            'base_unit_name' => 'Piece',
            'purchase_pack_name' => 'Box',
            'purchase_pack_qty' => 10,
            'purchase_quantity' => 2,
            'unit_cost' => 50,
            'unit_cost_base' => 5,
            'total_cost' => 100,
        ]);

        $return = app(ReturnService::class)->createReturn(new ReturnCreateData(
            type: 'PURCHASE',
            referenceId: $bill->id,
            referenceType: 'purchase_bill',
            returnNumber: '',
            returnDate: '2026-07-27',
            contactId: $supplier->id,
            contactName: $supplier->name,
            reasonId: null,
            reasonNote: null,
            items: [
                new ReturnItemData(
                    referenceItemId: $item->id,
                    referenceItemType: 'purchase_bill_item',
                    productId: $product->id,
                    productName: $product->name,
                    sellingUnitId: null,
                    packagingName: 'Box',
                    quantity: 1,
                    baseQuantity: 10,
                    unitPrice: 50,
                    total: 50,
                    reasonId: null,
                    notes: null,
                    restock: true,
                ),
            ],
            subtotal: 50,
            discount: 0,
            grandTotal: 50,
            refundAmount: 50,
            refundMethod: 'cash',
            notes: null,
            createdBy: 'Test',
        ));

        app(ReturnService::class)->completeReturn($return->id);

        $this->assertSame(30.0, (float) $product->fresh()->stock_quantity);
        $this->assertSame('completed', $return->fresh()->status);
    }

    public function test_legacy_purchase_return_writer_is_disabled(): void
    {
        $this->expectException(\LogicException::class);

        app(PurchaseReturnService::class)->create(new CreatePurchaseReturnData(
            'PRET-' . uniqid(), '2026-07-27', 1, [], 0, 'cash', 'Test'
        ));
    }
}
