<?php

namespace App\Domains\Reports\Services;

use App\Domains\Reports\DTOs\ReportFilters;
use App\Models\PurchaseBill;
use App\Models\ReturnModel;

class PurchaseReportService
{
    /**
     * Purchase Register — all purchase bills within date range.
     */
    public function register(ReportFilters $filters): array
    {
        $bills = PurchaseBill::with('supplier')
            ->whereBetween('date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->when($filters->contactId, fn($q) => $q->where('supplier_id', $filters->contactId))
            ->when($filters->status, fn($q) => $q->where('payment_status', $filters->status))
            ->orderBy($filters->sortBy, $filters->sortDir)
            ->paginate($filters->perPage);

        $returnsTotal = ReturnModel::where('type', 'PURCHASE')
            ->where('status', 'completed')
            ->whereBetween('return_date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->when($filters->contactId, fn($q) => $q->where('contact_id', $filters->contactId))
            ->sum('grand_total');

        $allBills = PurchaseBill::whereBetween('date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->when($filters->contactId, fn($q) => $q->where('supplier_id', $filters->contactId))
            ->get();

        return [
            'bills' => $bills->items(),
            'meta' => [
                'current_page' => $bills->currentPage(),
                'last_page' => $bills->lastPage(),
                'per_page' => $bills->perPage(),
                'total' => $bills->total(),
            ],
            'summary' => [
                'total_purchases' => $allBills->count(),
                'total_value' => round($allBills->sum('total_amount')),
                'total_paid' => round($allBills->sum('amount_paid')),
                'total_returns' => round($returnsTotal),
                'net_purchases' => round($allBills->sum('total_amount') - $returnsTotal),
                'average_purchase' => $allBills->count() > 0 ? round($allBills->sum('total_amount') / $allBills->count()) : 0,
            ],
        ];
    }

    /**
     * Purchases by Supplier �� aggregated per contact.
     */
    public function bySupplier(ReportFilters $filters): array
    {
        $rows = PurchaseBill::selectRaw('
                supplier_id,
                supplier_name,
                COUNT(*) as bill_count,
                SUM(total_amount) as total_value,
                SUM(amount_paid) as total_paid,
                SUM(discount) as total_discount
            ')
            ->whereBetween('date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->whereNotNull('supplier_id')
            ->groupBy('supplier_id', 'supplier_name')
            ->orderByDesc('total_value')
            ->get();

        return ['rows' => $rows];
    }

    /**
     * Purchase Returns �� all completed purchase returns in date range.
     */
    public function returns(ReportFilters $filters): array
    {
        $returns = ReturnModel::with(['contact', 'reference', 'reason'])
            ->where('type', 'PURCHASE')
            ->where('status', 'completed')
            ->whereBetween('return_date', [$filters->dateFrom ?? '2000-01-01', $filters->dateTo ?? now()->format('Y-m-d')])
            ->when($filters->contactId, fn($q) => $q->where('contact_id', $filters->contactId))
            ->orderBy('return_date', 'desc')
            ->get();

        return [
            'returns' => $returns,
            'total' => round($returns->sum('grand_total')),
            'count' => $returns->count(),
        ];
    }
}
