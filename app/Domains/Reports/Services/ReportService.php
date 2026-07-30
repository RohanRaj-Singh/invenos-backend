<?php

namespace App\Domains\Reports\Services;

use App\Domains\Reports\DTOs\ReportFilters;

/**
 * Legacy facade that delegates to new domain-specific services.
 *
 * All new code should use the specific services directly:
 * - SalesReportService
 * - PurchaseReportService
 * - InventoryReportService
 * - ContactReportService
 * - DashboardReportService
 * - ProductReportService
 *
 * This facade exists only for backward compatibility with existing controllers.
 */
class ReportService
{
    public function __construct(
        private readonly SalesReportService $salesReport,
        private readonly PurchaseReportService $purchaseReport,
        private readonly InventoryReportService $inventoryReport,
        private readonly DashboardReportService $dashboardReport,
    ) {}

    public function getSalesReport(string $from, string $to, ?int $customerId = null): array
    {
        $filters = new ReportFilters(dateFrom: $from, dateTo: $to, contactId: $customerId, perPage: 0);
        return $this->salesReport->register($filters);
    }

    public function getPurchaseReport(string $from, string $to, ?int $supplierId = null): array
    {
        $filters = new ReportFilters(dateFrom: $from, dateTo: $to, contactId: $supplierId, perPage: 0);
        return $this->purchaseReport->register($filters);
    }

    public function getInventoryReport(): array
    {
        return $this->inventoryReport->stockSummary(new ReportFilters());
    }

    public function getFinancialReport(): array
    {
        return [
            'outstanding_receivables' => round(\App\Models\Sale::where('outstanding_balance', '>', 0)->sum('outstanding_balance')),
            'outstanding_payables' => round(\App\Models\PurchaseBill::where('outstanding_balance', '>', 0)->sum('outstanding_balance')),
            'total_collections' => round(\App\Models\FinancialTransaction::where('type', 'collection')->sum('amount')),
            'total_payouts' => round(\App\Models\FinancialTransaction::where('type', 'payout')->sum('amount')),
            'net_cash_flow' => round(\App\Models\FinancialTransaction::where('type', 'collection')->sum('amount') - \App\Models\FinancialTransaction::where('type', 'payout')->sum('amount')),
            'payment_breakdown' => [
                'paid' => \App\Models\Sale::where('payment_status', 'paid')->count(),
                'partial' => \App\Models\Sale::where('payment_status', 'partial')->count(),
                'unpaid' => \App\Models\Sale::where('payment_status', 'unpaid')->count(),
            ],
        ];
    }

    public function getProfitReport(string $from, string $to): array
    {
        $filters = new ReportFilters(dateFrom: $from, dateTo: $to);
        return $this->salesReport->profit($filters);
    }

    public function getDashboardMetrics(): array
    {
        return $this->dashboardReport->today();
    }
}
