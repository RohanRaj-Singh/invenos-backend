<?php

namespace App\Http\Controllers;

use App\Domains\Reports\Services\ReportService;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(
        private readonly ReportService $reportService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('reports/ReportsLanding', []);
    }

    public function sales(): Response
    {
        $from = request('from', now()->subMonth()->format('Y-m-d'));
        $to = request('to', now()->format('Y-m-d'));
        $customerId = request('customer_id') ? (int) request('customer_id') : null;

        return Inertia::render('reports/SalesReport', [
            'report' => $this->reportService->getSalesReport($from, $to, $customerId),
            'filters' => ['from' => $from, 'to' => $to],
        ]);
    }

    public function purchases(): Response
    {
        $from = request('from', now()->subMonth()->format('Y-m-d'));
        $to = request('to', now()->format('Y-m-d'));
        $supplierId = request('supplier_id') ? (int) request('supplier_id') : null;

        return Inertia::render('reports/PurchaseReport', [
            'report' => $this->reportService->getPurchaseReport($from, $to, $supplierId),
            'filters' => ['from' => $from, 'to' => $to],
        ]);
    }

    public function inventory(): Response
    {
        return Inertia::render('reports/StockReport', [
            'report' => $this->reportService->getInventoryReport(),
        ]);
    }

    public function financial(): Response
    {
        return Inertia::render('reports/FinancialReport', [
            'report' => $this->reportService->getFinancialReport(),
        ]);
    }

    public function profit(): Response
    {
        $from = request('from', now()->subMonth()->format('Y-m-d'));
        $to = request('to', now()->format('Y-m-d'));

        return Inertia::render('reports/PnLReport', [
            'report' => $this->reportService->getProfitReport($from, $to),
            'filters' => ['from' => $from, 'to' => $to],
        ]);
    }

    public function dashboard(): \Illuminate\Http\JsonResponse
    {
        return response()->json($this->reportService->getDashboardMetrics());
    }
}
