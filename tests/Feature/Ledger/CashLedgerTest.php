<?php

namespace Tests\Feature\Ledger;

use App\Domains\Ledger\CashLedgerService;
use App\Domains\Purchasing\DTOs\CreatePurchaseData;
use App\Domains\Purchasing\Services\PurchaseService;
use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\DTOs\SaleItemData;
use App\Domains\Sales\Services\SaleService;
use App\Models\Contact;
use App\Models\FinancialTransaction;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CashLedgerTest extends TestCase
{
    use RefreshDatabase;

    private Product $product;
    private Contact $customer;
    private Contact $supplier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->product = Product::create([
            'name' => 'Capsule', 'sku' => 'CAP-1', 'base_unit_id' => 'capsule',
            'track_inventory' => false, 'stock_quantity' => 1000,
            'default_purchase_cost' => 7.5, 'status' => 'in-stock', 'created_by' => 'test',
        ]);

        $this->customer = Contact::create([
            'name' => 'Ali', 'phone' => '0300-0000001', 'roles' => ['customer'],
            'type' => 'person', 'opening_balance' => 0, 'current_balance' => 0,
        ]);

        $this->supplier = Contact::create([
            'name' => 'Supplier Co', 'phone' => '0300-0000002', 'roles' => ['supplier'],
            'type' => 'person', 'opening_balance' => 0, 'current_balance' => 0,
        ]);
    }

    private function makeSale(int $customerId, float $paid, float $total = 1000): Sale
    {
        return app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-' . uniqid(),
            customerId: $customerId,
            customerName: '',
            date: '2026-10-01',
            items: [SaleItemData::fromArray([
                'product_id' => $this->product->id,
                'product_name' => 'Capsule',
                'quantity' => $total / 100,
                'base_unit_quantity' => 1,
                'base_quantity' => $total / 100,
                'unit_price' => 100,
                'total' => $total,
            ])],
            discount: 0,
            amountPaid: $paid,
            paymentMethod: 'cash',
            paymentStatus: $paid >= $total ? 'paid' : ($paid > 0 ? 'partial' : 'unpaid'),
            source: 'pos',
            notes: null,
            createdBy: 'test',
        ));
    }

    public function test_partial_sale_records_cash_and_reduces_the_receivable(): void
    {
        $sale = $this->makeSale($this->customer->id, 600);

        $this->assertSame(400.0, (float) $sale->fresh()->outstanding_balance);
        $this->assertSame(400.0, (float) $this->customer->fresh()->current_balance);

        $this->assertDatabaseHas('financial_transactions', [
            'linked_sale_id' => $sale->id,
            'type' => 'collection',
            'direction' => 'in',
            'amount' => 600,
            'event_key' => 'sale-initial:' . $sale->id,
        ]);

        $summary = app(CashLedgerService::class)->summary('2026-10-01', '2026-10-31');
        $this->assertSame(600.0, $summary['total_in']);
        $this->assertSame(0.0, $summary['total_out']);
    }

    public function test_walk_in_sale_records_cash_without_a_contact(): void
    {
        $sale = $this->makeSale(0, 1000);

        $row = FinancialTransaction::where('linked_sale_id', $sale->id)
            ->where('type', 'collection')->first();

        $this->assertNotNull($row);
        $this->assertNull($row->contact_id);
        $this->assertSame(1000.0, (float) $row->amount);
    }

    public function test_credit_sale_records_no_cash_but_full_receivable(): void
    {
        $sale = $this->makeSale($this->customer->id, 0);

        $this->assertSame(1000.0, (float) $sale->fresh()->outstanding_balance);
        $this->assertSame(1000.0, (float) $this->customer->fresh()->current_balance);
        $this->assertSame(0, FinancialTransaction::where('linked_sale_id', $sale->id)
            ->where('type', 'collection')->count());
    }

    public function test_partial_purchase_records_payout_and_reduces_the_payable(): void
    {
        $bill = app(PurchaseService::class)->create(new CreatePurchaseData(
            invoiceRef: 'PUR-' . uniqid(),
            supplierId: $this->supplier->id,
            date: '2026-10-02',
            items: [\App\Domains\Purchasing\DTOs\PurchaseItemData::fromArray([
                'product_id' => $this->product->id,
                'product_name' => 'Capsule',
                'purchase_pack_qty' => 100,
                'purchase_quantity' => 1,
                'unit_cost' => 750,
                'total_cost' => 750,
            ])],
            discount: 0,
            amountPaid: 450,
            paymentMethod: 'cash',
            paymentStatus: 'partial',
            status: 'received',
            notes: null,
            createdBy: 'test',
        ));

        $this->assertSame(300.0, (float) $bill->fresh()->outstanding_balance);
        $this->assertSame(300.0, (float) $this->supplier->fresh()->current_balance);

        $this->assertDatabaseHas('financial_transactions', [
            'linked_purchase_id' => $bill->id,
            'type' => 'payout',
            'direction' => 'out',
            'amount' => 450,
            'event_key' => 'purchase-initial:' . $bill->id,
        ]);
    }

    public function test_event_key_makes_recording_idempotent(): void
    {
        $ledger = app(CashLedgerService::class);

        $row = [
            'contact_id' => $this->customer->id,
            'direction' => 'in', 'type' => 'collection', 'date' => '2026-10-03',
            'amount' => 100, 'method' => 'cash', 'reference' => 'X-1',
            'event_key' => 'test:event:1', 'created_by' => 'test',
        ];

        $ledger->record($row);
        $ledger->record($row);

        $this->assertSame(1, FinancialTransaction::where('event_key', 'test:event:1')->count());
    }

    public function test_reversal_is_a_compensating_row_not_a_delete(): void
    {
        $ledger = app(CashLedgerService::class);

        $created = $ledger->record([
            'contact_id' => $this->customer->id,
            'direction' => 'in', 'type' => 'collection', 'date' => '2026-10-04',
            'amount' => 250, 'method' => 'cash', 'reference' => 'X-2',
            'event_key' => 'test:event:2', 'created_by' => 'test',
        ])['transaction'];

        $reversal = $ledger->reverse($created, 'test reversal', 'tester');

        $this->assertSame('out', $reversal->direction);
        $this->assertSame($created->id, $reversal->reversal_of_id);
        $this->assertNotNull($created->fresh()->reversed_at);
        $this->assertSame(2, FinancialTransaction::whereIn('event_key', ['test:event:2', 'reversal:test:event:2'])->count());
    }
}
