<?php

namespace Tests\Feature\Ledger;

use App\Domains\Ledger\PartyLedgerService;
use App\Models\Contact;
use App\Models\FinancialTransaction;
use App\Models\PurchaseBill;
use App\Models\ReturnModel;
use App\Models\Sale;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PartyLedgerTest extends TestCase
{
    use RefreshDatabase;

    private function customer(): Contact
    {
        return Contact::create([
            'name' => 'Ali', 'phone' => '0300-1', 'roles' => ['customer'], 'type' => 'person',
            'opening_balance' => 500, 'current_balance' => 1250,
        ]);
    }

    private function supplier(): Contact
    {
        return Contact::create([
            'name' => 'Sup', 'phone' => '0300-2', 'roles' => ['supplier'], 'type' => 'person',
            'opening_balance' => 500, 'current_balance' => 1250,
        ]);
    }

    public function test_customer_statement_reconciles_opening_invoice_return_payment_and_refund(): void
    {
        $customer = $this->customer();

        Sale::create([
            'invoice_number' => 'INV-P1', 'date' => '2026-10-05', 'customer_id' => $customer->id,
            'customer_name' => 'Ali', 'subtotal' => 1000, 'discount' => 0, 'grand_total' => 1000,
            'amount_paid' => 0, 'outstanding_balance' => 1000, 'payment_status' => 'unpaid',
            'created_by' => 'test',
        ]);

        ReturnModel::create([
            'return_number' => 'SR-P1', 'type' => 'SALE', 'reference_type' => 'sale',
            'reference_id' => 1, 'contact_id' => $customer->id, 'return_date' => '2026-10-06',
            'status' => 'completed', 'grand_total' => 200, 'refund_amount' => 0,
            'created_by' => 'test',
        ]);

        FinancialTransaction::create([
            'contact_id' => $customer->id, 'direction' => 'in', 'type' => 'collection',
            'date' => '2026-10-07', 'amount' => 100, 'method' => 'cash',
            'reference' => 'PMT-1', 'created_by' => 'test',
        ]);

        FinancialTransaction::create([
            'contact_id' => $customer->id, 'direction' => 'out', 'type' => 'refund',
            'date' => '2026-10-08', 'amount' => 50, 'method' => 'cash',
            'reference' => 'REF-1', 'created_by' => 'test',
        ]);

        $statement = app(PartyLedgerService::class)
            ->statement($customer, '2026-10-01', '2026-10-31', 'customer');

        $this->assertSame(500.0, $statement['summary']['opening_balance']);
        $this->assertSame(1050.0, $statement['summary']['total_debit']);   // 1000 sale + 50 refund
        $this->assertSame(300.0, $statement['summary']['total_credit']);   // 200 return + 100 payment
        $this->assertSame(1250.0, $statement['summary']['closing_balance']);
        $this->assertSame(1250.0, $statement['rows'][array_key_last($statement['rows'])]['balance']);
    }

    public function test_customer_opening_balance_carries_prior_activity(): void
    {
        $customer = $this->customer();

        Sale::create([
            'invoice_number' => 'INV-OLD', 'date' => '2026-09-01', 'customer_id' => $customer->id,
            'customer_name' => 'Ali', 'subtotal' => 400, 'discount' => 0, 'grand_total' => 400,
            'amount_paid' => 0, 'outstanding_balance' => 400, 'payment_status' => 'unpaid',
            'created_by' => 'test',
        ]);

        $statement = app(PartyLedgerService::class)
            ->statement($customer, '2026-10-01', '2026-10-31', 'customer');

        $this->assertSame(900.0, $statement['summary']['opening_balance']); // 500 + 400
        $this->assertSame(900.0, $statement['summary']['closing_balance']);
        $this->assertCount(0, $statement['rows']);
    }

    public function test_supplier_statement_uses_the_same_convention(): void
    {
        $supplier = $this->supplier();

        PurchaseBill::create([
            'invoice_ref' => 'PUR-P1', 'supplier_id' => $supplier->id, 'supplier_name' => 'Sup',
            'date' => '2026-10-05', 'subtotal' => 1000, 'discount' => 0, 'total_amount' => 1000,
            'amount_paid' => 0, 'outstanding_balance' => 1000, 'payment_status' => 'unpaid',
            'created_by' => 'test',
        ]);

        ReturnModel::create([
            'return_number' => 'PR-P1', 'type' => 'PURCHASE', 'reference_type' => 'purchase_bill',
            'reference_id' => 1, 'contact_id' => $supplier->id, 'return_date' => '2026-10-06',
            'status' => 'completed', 'grand_total' => 200, 'refund_amount' => 0,
            'created_by' => 'test',
        ]);

        FinancialTransaction::create([
            'contact_id' => $supplier->id, 'direction' => 'out', 'type' => 'payout',
            'date' => '2026-10-07', 'amount' => 100, 'method' => 'cash',
            'reference' => 'PMT-2', 'created_by' => 'test',
        ]);

        FinancialTransaction::create([
            'contact_id' => $supplier->id, 'direction' => 'in', 'type' => 'refund',
            'date' => '2026-10-08', 'amount' => 50, 'method' => 'cash',
            'reference' => 'REF-2', 'created_by' => 'test',
        ]);

        $statement = app(PartyLedgerService::class)
            ->statement($supplier, '2026-10-01', '2026-10-31', 'supplier');

        $this->assertSame(1250.0, $statement['summary']['closing_balance']);
        $this->assertSame(1250.0, app(PartyLedgerService::class)->closingBalance($supplier, '2026-10-31'));
    }

    public function test_legacy_return_documents_are_credits_not_invoices(): void
    {
        $customer = $this->customer();

        Sale::create([
            'invoice_number' => 'INV-L1', 'date' => '2026-10-02', 'customer_id' => $customer->id,
            'customer_name' => 'Ali', 'subtotal' => 1000, 'discount' => 0, 'grand_total' => 1000,
            'amount_paid' => 0, 'outstanding_balance' => 1000, 'payment_status' => 'unpaid',
            'created_by' => 'test',
        ]);
        Sale::create([
            'invoice_number' => 'RET-L1', 'date' => '2026-10-03', 'customer_id' => $customer->id,
            'customer_name' => 'Ali', 'subtotal' => 300, 'discount' => 0, 'grand_total' => 300,
            'amount_paid' => 0, 'outstanding_balance' => 0, 'payment_status' => 'paid',
            'created_by' => 'test',
        ]);

        $statement = app(PartyLedgerService::class)
            ->statement($customer, '2026-10-01', '2026-10-31', 'customer');

        $this->assertSame(1200.0, $statement['summary']['closing_balance']); // 500 + 1000 - 300
        $types = array_column($statement['rows'], 'type');
        $this->assertContains('Sale', $types);
        $this->assertContains('Sale Return', $types);
    }
}
