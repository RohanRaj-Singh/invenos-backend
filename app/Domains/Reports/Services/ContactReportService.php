<?php

namespace App\Domains\Reports\Services;

use App\Domains\Ledger\PartyLedgerService;
use App\Domains\Reports\DTOs\ReportFilters;
use App\Models\Contact;
use App\Models\PurchaseBill;
use App\Models\Sale;

class ContactReportService
{
    public function __construct(
        private readonly PartyLedgerService $ledger,
    ) {}

    /**
     * Customer Ledger — derived by the shared party ledger.
     */
    public function customerLedger(ReportFilters $filters): array
    {
        $contactId = $filters->contactId;
        if (! $contactId) {
            throw new \InvalidArgumentException('customer_id is required for customer ledger.');
        }

        $contact = Contact::findOrFail($contactId);
        $statement = $this->ledger->statement(
            $contact,
            $filters->dateFrom ?? '2000-01-01',
            $filters->dateTo ?? now()->toDateString(),
            'customer',
        );

        return [
            'contact' => $contact->toArray(),
            'rows' => $statement['rows'],
            'opening_balance' => $statement['summary']['opening_balance'],
            'closing_balance' => $statement['summary']['closing_balance'],
        ];
    }

    /**
     * Supplier Ledger — derived by the shared party ledger.
     */
    public function supplierLedger(ReportFilters $filters): array
    {
        $contactId = $filters->contactId;
        if (! $contactId) {
            throw new \InvalidArgumentException('supplier_id is required for supplier ledger.');
        }

        $contact = Contact::findOrFail($contactId);
        $statement = $this->ledger->statement(
            $contact,
            $filters->dateFrom ?? '2000-01-01',
            $filters->dateTo ?? now()->toDateString(),
            'supplier',
        );

        return [
            'contact' => $contact->toArray(),
            'rows' => $statement['rows'],
            'opening_balance' => $statement['summary']['opening_balance'],
            'closing_balance' => $statement['summary']['closing_balance'],
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
            ->when($filters->contactId, fn ($q) => $q->where('customer_id', $filters->contactId))
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
            ->when($filters->contactId, fn ($q) => $q->where('supplier_id', $filters->contactId))
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
