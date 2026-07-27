<?php

namespace App\Domains\Payments\Services;

use App\Domains\Payments\DTOs\RecordPaymentData;
use App\Models\FinancialTransaction;
use App\Models\PurchaseBill;
use App\Models\Sale;
use Illuminate\Pagination\LengthAwarePaginator;

class PaymentService
{
    public function search(string $query = '', string $type = '', int $perPage = 25): LengthAwarePaginator
    {
        $q = FinancialTransaction::with('contact');
        if ($query) $q->where('reference', 'like', "%{$query}%");
        if ($type) $q->where('type', $type);
        return $q->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function recordCustomerPayment(RecordPaymentData $data): array
    {
        $sale = Sale::findOrFail($data->transactionId);
        if ($sale->payment_status === 'paid') {
            throw new \RuntimeException('Sale is already fully paid.');
        }
        $remaining = $sale->grand_total - $sale->amount_paid;
        if ($data->amount > $remaining) {
            throw new \RuntimeException("Payment of {$data->amount} exceeds remaining balance of {$remaining}.");
        }
        $newPaid = $sale->amount_paid + $data->amount;
        $newOutstanding = $sale->grand_total - $newPaid;
        $sale->update([
            'amount_paid' => $newPaid,
            'outstanding_balance' => $newOutstanding,
            'payment_status' => $newOutstanding <= 0 ? 'paid' : 'partial',
        ]);
        $ft = FinancialTransaction::create([
            'contact_id' => $sale->customer_id,
            'direction' => 'in', 'type' => 'collection',
            'date' => now()->format('Y-m-d'), 'amount' => $data->amount,
            'method' => $data->method,
            'reference' => $data->reference ?? "PMT-{$sale->invoice_number}",
            'description' => "Payment received for {$sale->invoice_number}",
            'linked_sale_id' => $sale->id, 'created_by' => $data->createdBy,
        ]);
        return ['transaction' => $ft, 'sale' => $sale->fresh()];
    }

    public function recordSupplierPayment(RecordPaymentData $data): array
    {
        $bill = PurchaseBill::findOrFail($data->transactionId);
        if ($bill->payment_status === 'paid') {
            throw new \RuntimeException('Purchase is already fully paid.');
        }
        $remaining = $bill->total_amount - $bill->amount_paid;
        if ($data->amount > $remaining) {
            throw new \RuntimeException("Payment of {$data->amount} exceeds remaining balance of {$remaining}.");
        }
        $newPaid = $bill->amount_paid + $data->amount;
        $newOutstanding = $bill->total_amount - $newPaid;
        $bill->update([
            'amount_paid' => $newPaid,
            'outstanding_balance' => $newOutstanding,
            'payment_status' => $newOutstanding <= 0 ? 'paid' : 'partial',
        ]);
        $ft = FinancialTransaction::create([
            'contact_id' => $bill->supplier_id,
            'direction' => 'out', 'type' => 'payout',
            'date' => now()->format('Y-m-d'), 'amount' => $data->amount,
            'method' => $data->method,
            'reference' => $data->reference ?? "PMT-{$bill->invoice_ref}",
            'description' => "Payment made for {$bill->invoice_ref}",
            'created_by' => $data->createdBy,
        ]);
        return ['transaction' => $ft, 'purchase' => $bill->fresh()];
    }

    public function getOutstandingBalances(): array
    {
        return [
            'customer_outstanding' => Sale::with('customer')->where('outstanding_balance', '>', 0)
                ->orderBy('outstanding_balance', 'desc')->get()->toArray(),
            'supplier_payables' => PurchaseBill::with('supplier')->where('outstanding_balance', '>', 0)
                ->orderBy('outstanding_balance', 'desc')->get()->toArray(),
        ];
    }
}
