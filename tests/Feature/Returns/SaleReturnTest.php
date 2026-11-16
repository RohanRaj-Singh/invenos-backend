<?php

namespace Tests\Feature\Returns;

use App\Domains\Returns\DTOs\ReturnCreateData;
use App\Domains\Returns\DTOs\ReturnItemData;
use App\Domains\Returns\Services\ReturnService;
use App\Domains\Sales\DTOs\CreateSaleReturnData;
use App\Domains\Sales\Services\SaleReturnService;
use App\Models\Contact;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleReturnTest extends TestCase
{
    use RefreshDatabase;

    public function test_canonical_sale_return_increases_inventory(): void
    {
        $customer = Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'C', 'phone' => '0300-111']);
        $product = Product::create(['name' => 'P1', 'sku' => 'P1-' . uniqid(), 'base_unit_id' => 'piece', 'stock_quantity' => 50]);

        $sale = Sale::create([
            'invoice_number' => 'INV-ORIG-' . uniqid(), 'date' => '2026-07-26',
            'customer_id' => $customer->id, 'customer_name' => $customer->name,
            'subtotal' => 200, 'grand_total' => 200, 'amount_paid' => 200,
            'outstanding_balance' => 0, 'payment_status' => 'paid', 'created_by' => 'Test',
        ]);
        $item = $sale->items()->create([
            'product_id' => $product->id, 'product_name' => $product->name,
            'packaging_quantity' => 5, 'base_unit_quantity' => 1, 'base_quantity' => 5,
            'unit_price' => 40, 'total' => 200, 'category' => 'General',
        ]);

        $return = app(ReturnService::class)->createReturn(new ReturnCreateData(
            type: 'SALE',
            referenceId: $sale->id,
            referenceType: 'sale',
            returnNumber: '',
            returnDate: '2026-07-27',
            contactId: $customer->id,
            contactName: $customer->name,
            reasonId: null,
            reasonNote: null,
            items: [
                new ReturnItemData(
                    referenceItemId: $item->id,
                    referenceItemType: 'sale_item',
                    productId: $product->id,
                    productName: $product->name,
                    sellingUnitId: null,
                    packagingName: 'Piece',
                    quantity: 2,
                    baseQuantity: 2,
                    unitPrice: 40,
                    total: 80,
                    reasonId: null,
                    notes: null,
                    restock: true,
                ),
            ],
            subtotal: 80,
            discount: 0,
            grandTotal: 80,
            refundAmount: 80,
            refundMethod: 'cash',
            notes: null,
            createdBy: 'Test',
        ));

        app(ReturnService::class)->completeReturn($return->id);

        $this->assertSame(52.0, (float) $product->fresh()->stock_quantity);
        $this->assertSame('completed', $return->fresh()->status);
    }

    public function test_legacy_sale_return_writer_is_disabled(): void
    {
        $this->expectException(\LogicException::class);

        app(SaleReturnService::class)->create(new CreateSaleReturnData(
            'RET-' . uniqid(), '2026-07-27', 1, [], 0, 'cash', 'Test'
        ));
    }
}
