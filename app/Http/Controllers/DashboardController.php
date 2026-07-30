<?php

namespace App\Http\Controllers;

use App\Domains\Inventory\Services\InventoryService;
use App\Domains\Reports\Services\DashboardReportService;
use App\Domains\Reports\Services\InventoryReportService;
use App\Domains\Reports\Services\SalesReportService;
use App\Domains\Reports\DTOs\ReportFilters;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardReportService $dashboardReport,
        private readonly InventoryService $inventoryService,
        private readonly InventoryReportService $inventoryReport,
        private readonly SalesReportService $salesReport,
    ) {}

    public function index(): Response
    {
        $filters = new ReportFilters(
            dateFrom: now()->startOfMonth()->format('Y-m-d'),
            dateTo: now()->format('Y-m-d'),
        );

        return Inertia::render('dashboard/Dashboard', [
            'metrics' => $this->dashboardReport->today(),
            'financial' => [
                'outstanding_receivables' => round(\App\Models\Sale::where('outstanding_balance', '>', 0)->sum('outstanding_balance')),
                'outstanding_payables' => round(\App\Models\PurchaseBill::where('outstanding_balance', '>', 0)->sum('outstanding_balance')),
                'payment_breakdown' => [
                    'paid' => \App\Models\Sale::where('payment_status', 'paid')->count(),
                    'partial' => \App\Models\Sale::where('payment_status', 'partial')->count(),
                    'unpaid' => \App\Models\Sale::where('payment_status', 'unpaid')->count(),
                ],
            ],
            'inventory' => $this->inventoryReport->stockSummary(new ReportFilters(perPage: 0)),
            'lowStock' => $this->inventoryService->getLowStock(),
            'profit' => $this->salesReport->profit($filters),
        ]);
    }

    public function metrics(): \Illuminate\Http\JsonResponse
    {
        return response()->json($this->dashboardReport->today());
    }
}
