<?php

namespace Tests\Feature\Reports;

use App\Domains\Reports\DTOs\ReportFilters;
use App\Domains\Reports\Services\FinancialReportService;
use App\Domains\Reports\Services\SalesReportService;
use App\Domains\Returns\DTOs\ReturnCreateData;
use App\Domains\Returns\DTOs\ReturnItemData;
use App\Domains\Returns\Services\ReturnService;
use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\DTOs\SaleItemData;
use App\Domains\Sales\Services\SaleService;
use App\Models\Contact;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CogsConsistencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_partial_return_reduces_cogs_the_same_way_in_overview_and_pnl(): void
    {
        $date = now()->format('Y-m-d');

        $customer = Contact::create([
            'type' => 'person',
            'roles' => ['customer'],
            'name' => 'Customer',
            'phone' => '0300-111',
        ]);

        $product = Product::create([
            'name' => 'Costed Product',
            'sku' => 'COGS-'.uniqid(),
            'base_unit_id' => 'piece',
            'stock_quantity' => 100,
            'average_cost' => 60,
            'status' => 'in-stock',
        ]);

        $sale = app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-COGS-'.uniqid(),
            customerId: $customer->id,
            customerName: $customer->name,
            date: $date,
            items: [
                SaleItemData::fromArray([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => 10,
                    'base_unit_quantity' => 1,
                    'base_quantity' => 10,
                    'unit_price' => 100,
                    'total' => 1000,
                ]),
            ],
            discount: 0,
            amountPaid: 1000,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'Test',
        ));

        $saleItem = $sale->items()->firstOrFail();

        $return = app(ReturnService::class)->createReturn(new ReturnCreateData(
            type: 'SALE',
            referenceId: $sale->id,
            referenceType: 'sale',
            returnNumber: '',
            returnDate: $date,
            contactId: $customer->id,
            contactName: $customer->name,
            reasonId: null,
            reasonNote: null,
            items: [
                new ReturnItemData(
                    referenceItemId: $saleItem->id,
                    referenceItemType: 'sale_item',
                    productId: $product->id,
                    productName: $product->name,
                    sellingUnitId: null,
                    packagingName: 'Piece',
                    quantity: 4,
                    baseQuantity: 4,
                    unitPrice: 100,
                    total: 400,
                    reasonId: null,
                    notes: null,
                    restock: true,
                ),
            ],
            subtotal: 400,
            discount: 0,
            grandTotal: 400,
            refundAmount: 400,
            refundMethod: 'cash',
            notes: null,
            createdBy: 'Test',
        ));

        app(ReturnService::class)->completeReturn($return->id);

        $filters = new ReportFilters(dateFrom: $date, dateTo: $date);

        $overview = app(FinancialReportService::class)->overview($filters);
        $profit = app(SalesReportService::class)->profit($filters);

        // 10 sold at cost 60, 4 returned => 6 x 60 = 360 COGS.
        $this->assertSame(360.0, (float) $profit['cogs']);
        $this->assertSame(240.0, (float) $profit['gross_profit']);
        $this->assertSame(240.0, (float) $overview['summary']['gross_profit']);
        $this->assertSame(
            (float) $profit['cogs'],
            (float) collect($profit['bill_wise'])->sum('cogs')
        );
    }
}
