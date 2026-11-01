<?php

namespace Tests\Feature\Returns;

use App\Domains\Returns\DTOs\ReturnCreateData;
use App\Domains\Returns\DTOs\ReturnItemData;
use App\Domains\Returns\Services\ReturnService;
use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\DTOs\SaleItemData;
use App\Domains\Sales\Services\SaleService;
use App\Models\Contact;
use App\Models\FinancialTransaction;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReturnServiceTest extends TestCase
{
    use RefreshDatabase;

    private Product $product;
    private Contact $customer;
    private Sale $sale;

    protected function setUp(): void
    {
        parent::setUp();

        $this->product = Product::create([
            'name' => 'Capsule', 'sku' => 'CAP-R1', 'base_unit_id' => 'capsule',
            'track_inventory' => true, 'stock_quantity' => 1000,
            'default_purchase_cost' => 60, 'status' => 'in-stock', 'created_by' => 'test',
        ]);

        $this->customer = Contact::create([
            'name' => 'Ali', 'phone' => '0300-1', 'roles' => ['customer'],
            'type' => 'person', 'opening_balance' => 0, 'current_balance' => 0,
        ]);

        $this->sale = app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-RET-1',
            customerId: $this->customer->id,
            customerName: 'Ali',
            date: '2026-10-10',
            items: [SaleItemData::fromArray([
                'product_id' => $this->product->id,
                'product_name' => 'Capsule',
                'quantity' => 10,
                'base_unit_quantity' => 1,
                'base_quantity' => 10,
                'unit_price' => 100,
                'total' => 1000,
            ])],
            discount: 0,
            amountPaid: 1000,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'test',
        ));
    }

    private function returnData(float $grand, float $refund, bool $restock = true, float $qty = 4): ReturnCreateData
    {
        $saleItem = $this->sale->items()->firstOrFail();

        return new ReturnCreateData(
            type: 'SALE',
            referenceId: $this->sale->id,
            referenceType: 'sale',
            returnNumber: '',
            returnDate: '2026-10-12',
            contactId: $this->customer->id,
            contactName: 'Ali',
            reasonId: null,
            reasonNote: 'test',
            items: [new ReturnItemData(
                referenceItemId: (int) $saleItem->id,
                referenceItemType: 'sale_item',
                productId: $this->product->id,
                productName: 'Capsule',
                sellingUnitId: null,
                packagingName: 'Capsule',
                quantity: $qty,
                baseQuantity: $qty,
                unitPrice: 100,
                total: $qty * 100,
                reasonId: null,
                notes: null,
                restock: $restock,
            )],
            subtotal: $grand,
            discount: 0,
            grandTotal: $grand,
            refundAmount: $refund,
            refundMethod: 'cash',
            notes: null,
            createdBy: 'test',
        );
    }

    public function test_full_refund_sale_return_applies_stock_balance_and_cash(): void
    {
        $service = app(ReturnService::class);
        $return = $service->createReturn($this->returnData(400, 400));
        $service->completeReturn($return->id);

        $return->refresh();

        $this->assertSame('completed', $return->status);
        $this->assertNotNull($return->effects_applied_at);
        $this->assertSame(994.0, (float) $this->product->fresh()->stock_quantity);
        $this->assertSame(0.0, (float) $this->customer->fresh()->current_balance);

        $this->assertDatabaseHas('financial_transactions', [
            'linked_return_id' => $return->id,
            'type' => 'refund',
            'direction' => 'out',
            'amount' => 400,
        ]);

        $this->assertSame(400.0, (float) $this->sale->fresh()->return_total);
        $this->assertSame('partial', $this->sale->fresh()->return_status);
    }

    public function test_credit_only_return_records_no_cash(): void
    {
        $service = app(ReturnService::class);
        $return = $service->createReturn($this->returnData(400, 0));
        $service->completeReturn($return->id);

        $this->assertSame(-400.0, (float) $this->customer->fresh()->current_balance);
        $this->assertSame(0, FinancialTransaction::where('linked_return_id', $return->id)->count());
    }

    public function test_partial_refund_leaves_the_rest_as_credit(): void
    {
        $service = app(ReturnService::class);
        $return = $service->createReturn($this->returnData(500, 200));
        $service->completeReturn($return->id);

        // -500 credit note, +200 refund settled -> -300 remaining credit.
        $this->assertSame(-300.0, (float) $this->customer->fresh()->current_balance);
        $this->assertDatabaseHas('financial_transactions', [
            'linked_return_id' => $return->id, 'type' => 'refund', 'amount' => 200,
        ]);
    }

    public function test_non_restocking_return_does_not_change_stock(): void
    {
        $service = app(ReturnService::class);
        $return = $service->createReturn($this->returnData(400, 400, restock: false));
        $service->completeReturn($return->id);

        // Sale already took 10; the damaged return adds then writes off 4.
        $this->assertSame(990.0, (float) $this->product->fresh()->stock_quantity);
    }

    public function test_completing_twice_is_rejected(): void
    {
        $service = app(ReturnService::class);
        $return = $service->createReturn($this->returnData(400, 400));
        $service->completeReturn($return->id);

        $this->expectException(\InvalidArgumentException::class);
        $service->completeReturn($return->id);
    }

    public function test_reversal_compensates_every_effect(): void
    {
        $service = app(ReturnService::class);
        $return = $service->createReturn($this->returnData(400, 400));
        $service->completeReturn($return->id);

        $service->reverseReturn($return->id, 'tester');

        $return->refresh();
        $this->assertSame('reversed', $return->status);
        $this->assertSame(990.0, (float) $this->product->fresh()->stock_quantity);
        $this->assertSame(0.0, (float) $this->customer->fresh()->current_balance);
        $this->assertSame(0.0, (float) $this->sale->fresh()->return_total);
        $this->assertNotNull(
            FinancialTransaction::where('linked_return_id', $return->id)
                ->where('type', 'refund')->first()->reversed_at
        );
    }

    public function test_over_return_is_rejected(): void
    {
        $service = app(ReturnService::class);

        $this->expectException(\InvalidArgumentException::class);
        $service->createReturn($this->returnData(1100, 1100, qty: 11));
    }
}
