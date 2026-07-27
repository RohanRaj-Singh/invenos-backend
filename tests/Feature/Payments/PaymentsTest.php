<?php

namespace Tests\Feature\Payments;

use App\Domains\Payments\DTOs\RecordPaymentData;
use App\Domains\Payments\Services\PaymentService;
use App\Models\Contact;
use App\Models\PurchaseBill;
use App\Models\Sale;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentsTest extends TestCase
{
    use RefreshDatabase;

    private function makeSale(float $total): Sale
    {
        $c = Contact::create(['type' => 'person', 'roles' => ['customer'], 'name' => 'C', 'phone' => '0300-111']);
        return Sale::create([
            'invoice_number' => 'INV-' . uniqid(),
            'customer_id' => $c->id,
            'customer_name' => 'C',
            'date' => now()->format('Y-m-d'),
            'subtotal' => $total,
            'grand_total' => $total,
            'amount_paid' => 0,
            'outstanding_balance' => $total,
            'payment_status' => 'unpaid',
            'created_by' => 'Test',
        ]);
    }

    public function test_can_record_customer_payment(): void
    {
        $sale = $this->makeSale(1000);
        app(PaymentService::class)->recordCustomerPayment(
            new RecordPaymentData('sale', $sale->id, 500, 'cash', 'PMT-001', 'Test')
        );
        $sale->refresh();
        $this->assertEquals(500, $sale->amount_paid);
        $this->assertEquals(500, $sale->outstanding_balance);
        $this->assertEquals('partial', $sale->payment_status);
        $this->assertDatabaseHas('financial_transactions', ['amount' => 500, 'type' => 'collection']);
    }

    public function test_can_fully_pay_sale(): void
    {
        $sale = $this->makeSale(500);
        app(PaymentService::class)->recordCustomerPayment(
            new RecordPaymentData('sale', $sale->id, 500, 'cash', null, 'Test')
        );
        $sale->refresh();
        $this->assertEquals(0, $sale->outstanding_balance);
        $this->assertEquals('paid', $sale->payment_status);
    }

    public function test_overpayment_rejected(): void
    {
        $sale = $this->makeSale(200);
        $this->expectException(\RuntimeException::class);
        app(PaymentService::class)->recordCustomerPayment(
            new RecordPaymentData('sale', $sale->id, 999, 'cash', null, 'Test')
        );
    }

    public function test_can_record_supplier_payment(): void
    {
        $s = Contact::create(['type' => 'organization', 'roles' => ['supplier'], 'name' => 'S', 'phone' => '0300-222']);
        $bill = PurchaseBill::create([
            'invoice_ref' => 'PUR-' . uniqid(),
            'supplier_id' => $s->id,
            'supplier_name' => 'S',
            'date' => now()->format('Y-m-d'),
            'subtotal' => 3000, 'total_amount' => 3000,
            'amount_paid' => 0, 'outstanding_balance' => 3000,
            'payment_status' => 'unpaid', 'status' => 'received',
            'created_by' => 'Test',
        ]);
        app(PaymentService::class)->recordSupplierPayment(
            new RecordPaymentData('purchase', $bill->id, 1500, 'transfer', null, 'Test')
        );
        $bill->refresh();
        $this->assertEquals(1500, $bill->amount_paid);
        $this->assertEquals('partial', $bill->payment_status);
    }

    public function test_outstanding_balances(): void
    {
        $sale = $this->makeSale(400);
        app(PaymentService::class)->recordCustomerPayment(
            new RecordPaymentData('sale', $sale->id, 100, 'cash', null, 'Test')
        );
        $result = app(PaymentService::class)->getOutstandingBalances();
        $this->assertNotEmpty($result['customer_outstanding']);
    }
}
