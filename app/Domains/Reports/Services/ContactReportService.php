<?php

namespace App\Domains\Reports\Services;

use App\Domains\Reports\DTOs\ReportFilters;
use App\Models\Contact;
use App\Models\FinancialTransaction;
use App\Models\PurchaseBill;
use App\Models\ReturnModel;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;

class ContactReportService
{
    /**
     * Customer Ledger — all financial activity for a specific customer.
     */
    public function customerLedger(ReportFilters $filters): array
    {
        $contactId = $filters->contactId;
        if (!$contactId) {
            throw new \InvalidArgumentException('customer_id is required for customer ledger.');
        }

        $contact = Contact::findOrFail($contactId);
        $rows = [];
        $balance = 0;

        // Sales
        $sales = Sale::where('customer_id', $contactId)
            ->whereBetween('date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->orderBy('date')
            ->get();

        foreach ($sales as $sale) {
            $balance += $sale->grand_total;
            $rows[] = [
                'date' => $sale->date->format('Y-m-d'),
                'type' => 'Sale',
                'ref' => $sale->invoice_number,
                'description' => $sale->notes ?: "Sale — {$sale->invoice_number}",
                'debit' => $sale->grand_total,
                'credit' => 0,
                'balance' => $balance,
            ];
        }

        // Sale returns
        $returns = ReturnModel::where('type', 'SALE')
            ->where('contact_id', $contactId)
            ->where('status', 'completed')
            ->whereBetween('return_date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->orderBy('return_date')
            ->get();

        foreach ($returns as $return) {
            $balance -= $return->grand_total;
            $rows[] = [
                'date' => $return->return_date->format('Y-m-d'),
                'type' => 'Sale Return',
                'ref' => $return->return_number,
                'description' => $return->reason?->label ?? 'Return',
                'debit' => 0,
                'credit' => $return->grand_total,
                'balance' => $balance,
            ];
        }

        // Payments received
        $payments = FinancialTransaction::where('contact_id', $contactId)
            ->where('direction', 'in')
            ->whereBetween('date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->orderBy('date')
            ->get();

        foreach ($payments as $payment) {
            $balance -= $payment->amount;
            $rows[] = [
                'date' => $payment->date->format('Y-m-d'),
                'type' => 'Payment',
                'ref' => $payment->reference ?? '—',
                'description' => $payment->description ?? $payment->type,
                'debit' => 0,
                'credit' => $payment->amount,
                'balance' => $balance,
            ];
        }

        usort($rows, fn($a, $b) => $a['date'] <=> $b['date']);

        return [
            'contact' => $contact->toArray(),
            'rows' => $rows,
        ];
    }

    /**
     * Supplier Ledger — all financial activity for a specific supplier.
     */
    public function supplierLedger(ReportFilters $filters): array
    {
        $contactId = $filters->contactId;
        if (!$contactId) {
            throw new \InvalidArgumentException('supplier_id is required for supplier ledger.');
        }

        $contact = Contact::findOrFail($contactId);
        $rows = [];
        $balance = 0;

        // Purchase bills
        $bills = PurchaseBill::where('supplier_id', $contactId)
            ->whereBetween('date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->orderBy('date')
            ->get();

        foreach ($bills as $bill) {
            $balance += $bill->total_amount;
            $rows[] = [
                'date' => $bill->date->format('Y-m-d'),
                'type' => 'Purchase',
                'ref' => $bill->invoice_ref,
                'description' => "Purchase from {$bill->supplier_name}",
                'debit' => $bill->total_amount,
                'credit' => 0,
                'balance' => $balance,
            ];
        }

        // Purchase returns
        $returns = ReturnModel::where('type', 'PURCHASE')
            ->where('contact_id', $contactId)
            ->where('status', 'completed')
            ->whereBetween('return_date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->orderBy('return_date')
            ->get();

        foreach ($returns as $return) {
            $balance -= $return->grand_total;
            $rows[] = [
                'date' => $return->return_date->format('Y-m-d'),
                'type' => 'Purchase Return',
                'ref' => $return->return_number,
                'description' => $return->reason?->label ?? 'Return',
                'debit' => 0,
                'credit' => $return->grand_total,
                'balance' => $balance,
            ];
        }

        // Payments made
        $payments = FinancialTransaction::where('contact_id', $contactId)
            ->where('direction', 'out')
            ->whereBetween('date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->orderBy('date')
            ->get();

        foreach ($payments as $payment) {
            $balance -= $payment->amount;
            $rows[] = [
                'date' => $payment->date->format('Y-m-d'),
                'type' => 'Payment',
                'ref' => $payment->reference ?? '—',
                'description' => $payment->description ?? $payment->type,
                'debit' => 0,
                'credit' => $payment->amount,
                'balance' => $balance,
            ];
        }

        usort($rows, fn($a, $b) => $a['date'] <=> $b['date']);

        return [
            'contact' => $contact->toArray(),
            'rows' => $rows,
        ];
    }

    /**
     * Outstanding — all unpaid/partial invoices grouped by contact.
     */
    public function outstanding(ReportFilters $filters): array
    {
        $customers = Sale::selectRaw('
                customer_id,
                customer_name,
                COUNT(*) as invoice_count,
                SUM(outstanding_balance) as total_outstanding
            ')
            ->where('outstanding_balance', '>', 0)
            ->when($filters->contactId, fn($q) => $q->where('customer_id', $filters->contactId))
            ->groupBy('customer_id', 'customer_name')
            ->orderByDesc('total_outstanding')
            ->get()
            ->toArray();

        $suppliers = PurchaseBill::selectRaw('
                supplier_id,
                supplier_name,
                COUNT(*) as bill_count,
                SUM(outstanding_balance) as total_outstanding
            ')
            ->where('outstanding_balance', '>', 0)
            ->when($filters->contactId, fn($q) => $q->where('supplier_id', $filters->contactId))
            ->groupBy('supplier_id', 'supplier_name')
            ->orderByDesc('total_outstanding')
            ->get()
            ->toArray();

        return [
            'receivables' => [
                'total' => round(collect($customers)->sum('total_outstanding')),
                'customers' => $customers,
            ],
            'payables' => [
                'total' => round(collect($suppliers)->sum('total_outstanding')),
                'suppliers' => $suppliers,
            ],
        ];
    }
}
