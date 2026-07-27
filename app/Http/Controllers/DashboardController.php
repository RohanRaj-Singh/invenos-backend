<?php

namespace App\Http\Controllers;

use App\Domains\Inventory\Services\InventoryService;
use App\Domains\Reports\Services\ReportService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly ReportService $reportService,
        private readonly InventoryService $inventoryService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('dashboard/Dashboard', [
            'metrics' => $this->reportService->getDashboardMetrics(),
            'financial' => $this->reportService->getFinancialReport(),
            'inventory' => $this->reportService->getInventoryReport(),
            'lowStock' => $this->inventoryService->getLowStock(),
            'profit' => $this->reportService->getProfitReport(
                now()->startOfMonth()->format('Y-m-d'),
                now()->format('Y-m-d')
            ),
        ]);
    }

    public function metrics(): \Illuminate\Http\JsonResponse
    {
        return response()->json($this->reportService->getDashboardMetrics());
    }
}
