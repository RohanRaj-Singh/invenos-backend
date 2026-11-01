<?php

namespace App\Domains\Ledger;

use App\Models\Contact;
use App\Models\FinancialTransaction;
use App\Models\PurchaseBill;
use App\Models\ReturnModel;
use App\Models\Sale;

/**
 * Single derivation of a party's ledger.
 *
 * Display convention (matches the existing ledger screens):
 *   debit  = increases the balance
 *   credit = decreases the balance
 *   balance = opening + debits - credits
 *
 * Documents (sales/purchases) create the obligation; cash settlements reduce
 * it; refunds paid to a customer (or received from a supplier) increase it.
 * `invoice` cash memos and `OPENING` adjustments are never counted.
 */
class PartyLedgerService
{
    public function statement(Contact $party, ?string $from = null, ?string $to = null, ?string $type = null): array
    {
        $type = $type ?: ($this->isCustomer($party) ? 'customer' : 'supplier');
        $from = $from ?: '2000-01-01';
        $to = $to ?: now()->toDateString();

        $opening = $this->openingBalance($party, $from, $type);
        $balance = $opening;
        $debitTotal = 0.0;
        $creditTotal = 0.0;
        $rows = [];

        foreach ($this->movements($party, $type, $from, $to) as $movement) {
            $balance += $movement['debit'] - $movement['credit'];
            $debitTotal += $movement['debit'];
            $creditTotal += $movement['credit'];
            $movement['balance'] = round($balance, 2);
            $rows[] = $movement;
        }

        return [
            'party' => [
                'id' => $party->id,
                'name' => $party->name,
                'type' => $type,
                'phone' => $party->phone,
            ],
            'period' => ['from' => $from, 'to' => $to],
            'summary' => [
                'opening_balance' => round($opening, 2),
                'total_debit' => round($debitTotal, 2),
                'total_credit' => round($creditTotal, 2),
                'closing_balance' => round($balance, 2),
            ],
            'rows' => $rows,
        ];
    }

    public function closingBalance(Contact $party, ?string $asOf = null, ?string $type = null): float
    {
        $type = $type ?: ($this->isCustomer($party) ? 'customer' : 'supplier');
        $asOf = $asOf ?: now()->toDateString();

        $balance = (float) $party->opening_balance;
        foreach ($this->movements($party, $type, '2000-01-01', $asOf) as $movement) {
            $balance += $movement['debit'] - $movement['credit'];
        }

        return round($balance, 2);
    }

    public function openingBalance(Contact $party, string $from, ?string $type = null): float
    {
        $type = $type ?: ($this->isCustomer($party) ? 'customer' : 'supplier');

        $balance = (float) $party->opening_balance;
        foreach ($this->movements($party, $type, '2000-01-01', $from, exclusiveTo: true) as $movement) {
            $balance += $movement['debit'] - $movement['credit'];
        }

        return round($balance, 2);
    }

    /**
     * @return array<int, array{date:string,type:string,ref:string,description:string,debit:float,credit:float}>
     */
    public function movements(Contact $party, string $type, string $from, string $to, bool $exclusiveTo = false): array
    {
        $rows = [];

        if ($type === 'customer') {
            // Real invoices (legacy RET- documents are returns, not invoices).
            Sale::where('customer_id', $party->id)
                ->whereNull('deleted_at')
                ->where('invoice_number', 'not like', 'RET-%')
                ->whereBetween('date', [$from, $to])
                ->get()
                ->each(function (Sale $sale) use (&$rows) {
                    $rows[] = [
                        'date' => $sale->date->format('Y-m-d'),
                        'type' => 'Sale',
                        'ref' => $sale->invoice_number,
                        'description' => $sale->notes ?: 'Sale — ' . $sale->invoice_number,
                        'debit' => (float) $sale->grand_total,
                        'credit' => 0.0,
                    ];
                });

            // Legacy RET- sales are returns.
            Sale::where('customer_id', $party->id)
                ->whereNull('deleted_at')
                ->where('invoice_number', 'like', 'RET-%')
                ->whereBetween('date', [$from, $to])
                ->get()
                ->each(function (Sale $sale) use (&$rows) {
                    $rows[] = [
                        'date' => $sale->date->format('Y-m-d'),
                        'type' => 'Sale Return',
                        'ref' => $sale->invoice_number,
                        'description' => $sale->notes ?: 'Return — ' . $sale->invoice_number,
                        'debit' => 0.0,
                        'credit' => (float) $sale->grand_total,
                    ];
                });

            ReturnModel::where('type', 'SALE')
                ->where('contact_id', $party->id)
                ->where('status', 'completed')
                ->whereBetween('return_date', [$from, $to])
                ->get()
                ->each(function (ReturnModel $return) use (&$rows) {
                    $rows[] = [
                        'date' => $return->return_date->format('Y-m-d'),
                        'type' => 'Sale Return',
                        'ref' => $return->return_number,
                        'description' => $return->reason_note ?: 'Return — ' . $return->return_number,
                        'debit' => 0.0,
                        'credit' => (float) $return->grand_total,
                    ];
                });
        } else {
            PurchaseBill::where('supplier_id', $party->id)
                ->whereNull('deleted_at')
                ->where('invoice_ref', 'not like', 'PRET-%')
                ->whereBetween('date', [$from, $to])
                ->get()
                ->each(function (PurchaseBill $bill) use (&$rows) {
                    $rows[] = [
                        'date' => $bill->date->format('Y-m-d'),
                        'type' => 'Purchase',
                        'ref' => $bill->invoice_ref,
                        'description' => $bill->notes ?: 'Purchase — ' . $bill->invoice_ref,
                        'debit' => (float) $bill->total_amount,
                        'credit' => 0.0,
                    ];
                });

            PurchaseBill::where('supplier_id', $party->id)
                ->whereNull('deleted_at')
                ->where('invoice_ref', 'like', 'PRET-%')
                ->whereBetween('date', [$from, $to])
                ->get()
                ->each(function (PurchaseBill $bill) use (&$rows) {
                    $rows[] = [
                        'date' => $bill->date->format('Y-m-d'),
                        'type' => 'Purchase Return',
                        'ref' => $bill->invoice_ref,
                        'description' => $bill->notes ?: 'Return — ' . $bill->invoice_ref,
                        'debit' => 0.0,
                        'credit' => (float) $bill->total_amount,
                    ];
                });

            ReturnModel::where('type', 'PURCHASE')
                ->where('contact_id', $party->id)
                ->where('status', 'completed')
                ->whereBetween('return_date', [$from, $to])
                ->get()
                ->each(function (ReturnModel $return) use (&$rows) {
                    $rows[] = [
                        'date' => $return->return_date->format('Y-m-d'),
                        'type' => 'Purchase Return',
                        'ref' => $return->return_number,
                        'description' => $return->reason_note ?: 'Return — ' . $return->return_number,
                        'debit' => 0.0,
                        'credit' => (float) $return->grand_total,
                    ];
                });
        }

        // Cash settlements. Refunds increase the balance; everything else reduces it.
        FinancialTransaction::where('contact_id', $party->id)
            ->whereIn('type', ['collection', 'payout', 'refund', 'advance', 'adjustment'])
            ->where(function ($q) {
                $q->whereNull('reference')->orWhere('reference', '!=', 'OPENING');
            })
            ->whereBetween('date', [$from, $to])
            ->orderBy('date')->orderBy('id')
            ->get()
            ->each(function (FinancialTransaction $transaction) use (&$rows) {
                $isRefund = $transaction->type === 'refund';
                $amount = (float) $transaction->amount;

                $rows[] = [
                    'date' => $transaction->date->format('Y-m-d'),
                    'type' => $isRefund ? 'Refund' : 'Payment',
                    'ref' => $transaction->reference ?: '—',
                    'description' => $transaction->description ?: ucfirst($transaction->type),
                    'debit' => $isRefund ? $amount : 0.0,
                    'credit' => $isRefund ? 0.0 : $amount,
                ];
            });

        usort($rows, fn ($a, $b) => [$a['date'], $a['type'], $a['ref']] <=> [$b['date'], $b['type'], $b['ref']]);

        // For opening balances we want everything strictly before the period.
        if ($exclusiveTo) {
            $rows = array_values(array_filter($rows, fn ($row) => $row['date'] < $to));
        }

        return $rows;
    }

    private function isCustomer(Contact $party): bool
    {
        return in_array('customer', $party->roles ?? [], true);
    }
}
