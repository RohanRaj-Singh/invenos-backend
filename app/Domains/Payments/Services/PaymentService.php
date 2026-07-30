<?php

namespace App\Domains\Payments\Services;

use App\Domains\Payments\DTOs\RecordPaymentData;
use App\Models\FinancialTransaction;
use App\Models\PurchaseBill;
use App\Models\Sale;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    /**
     * Search recorded payments (collection/payout only — not invoice records).
     */
    public function search(string $query = '', string $type = '', string $dateFrom = '', string $dateTo = '', int $perPage = 25): LengthAwarePaginator
    {
        $q = FinancialTransaction::with('contact')
            ->whereIn('type', ['collection', 'payout']); // only actual payments

        if ($query) {
            $q->where(function ($q) use ($query) {
                $q->where('reference', 'like', "%{$query}%")
                  ->orWhereHas('contact', fn ($c) => $c->where('name', 'like', "%{$query}%"));
            });
        }
        if ($type) {
            $q->where('type', $type);
        }
        if ($dateFrom) {
            $q->whereDate('date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $q->whereDate('date', '<=', $dateTo);
        }
        return $q->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Get outstanding invoices and bills for the payments page.
     */
    public function getOutstandingBalances(): array
    {
        return [
            'customer_outstanding' => Sale::with('customer')
                ->where('outstanding_balance', '>', 0)
                ->orderBy('outstanding_balance', 'desc')
                ->get()
                ->toArray(),
            'supplier_payables' => PurchaseBill::with('supplier')
                ->where('outstanding_balance', '>', 0)
                ->orderBy('outstanding_balance', 'desc')
                ->get()
                ->toArray(),
        ];
    }

    public function recordCustomerPayment(RecordPaymentData $data): array
    {
        return DB::transaction(function () use ($data) {
            $sale = Sale::lockForUpdate()->findOrFail($data->transactionId);
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

            // Reduce customer balance — they paid, so they owe less
            if ($sale->customer) {
                $sale->customer->decrement('current_balance', $data->amount);
            }

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
        });
    }

    public function recordSupplierPayment(RecordPaymentData $data): array
    {
        return DB::transaction(function () use ($data) {
            $bill = PurchaseBill::lockForUpdate()->findOrFail($data->transactionId);
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

            // Reduce supplier balance — we paid, so we owe less
            if ($bill->supplier) {
                $bill->supplier->decrement('current_balance', $data->amount);
            }

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
        });
    }
}
