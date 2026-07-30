<?php

namespace App\Http\Controllers;

use App\Domains\Reports\DTOs\ReportFilters;
use App\Domains\Reports\Services\ContactReportService;
use App\Domains\Reports\Services\DashboardReportService;
use App\Domains\Reports\Services\ExportService;
use App\Domains\Reports\Services\InventoryReportService;
use App\Domains\Reports\Services\DayBookReportService;
use App\Domains\Reports\Services\FinancialReportService;
use App\Domains\Reports\Services\ProductReportService;
use App\Domains\Reports\Services\PurchaseReportService;
use App\Domains\Reports\Services\SalesReportService;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(
        private readonly SalesReportService $salesReport,
        private readonly PurchaseReportService $purchaseReport,
        private readonly InventoryReportService $inventoryReport,
        private readonly ContactReportService $contactReport,
        private readonly DashboardReportService $dashboardReport,
        private readonly ProductReportService $productReport,
        private readonly DayBookReportService $dayBookReport,
        private readonly FinancialReportService $financialReport,
        private readonly ExportService $export,
    ) {}

    public function index(): Response
    {
        return Inertia::render('reports/ReportsLanding');
    }

    // ─── Sales Reports ────────────────────────────────────────

    public function salesRegister(): Response
    {
        $filters = ReportFilters::fromRequest(request());
        $report = $this->salesReport->register($filters);
        $topProducts = $this->salesReport->topProducts($filters);
        $byCustomer = $this->salesReport->byCustomer($filters);
        return Inertia::render('reports/SalesReport', [
            'report' => $report,
            'top_products' => $topProducts['products'] ?? [],
            'customer_sales' => $byCustomer['rows'] ?? [],
            'filters' => $filters->toArray(),
        ]);
    }

    public function salesByCustomer(): Response
    {
        $filters = ReportFilters::fromRequest(request());
        return Inertia::render('reports/CustomerSales', [
            'report' => $this->salesReport->byCustomer($filters),
            'filters' => $filters->toArray(),
        ]);
    }

    public function topProducts(): Response
    {
        $filters = ReportFilters::fromRequest(request());
        return Inertia::render('reports/TopProducts', [
            'report' => $this->salesReport->topProducts($filters),
            'filters' => $filters->toArray(),
        ]);
    }

    // ─── Purchase Reports ─────────────────────────────────────

    public function purchaseRegister(): Response
    {
        $filters = ReportFilters::fromRequest(request());
        return Inertia::render('reports/PurchaseReport', [
            'report' => $this->purchaseReport->register($filters),
            'filters' => $filters->toArray(),
        ]);
    }

    // ─── Inventory Reports ────────────────────────────────────

    public function stockSummary(): Response
    {
        $filters = ReportFilters::fromRequest(request());
        return Inertia::render('reports/StockReport', [
            'report' => $this->inventoryReport->stockSummary($filters),
            'filters' => $filters->toArray(),
        ]);
    }

    public function stockLedger(): Response
    {
        $filters = ReportFilters::fromRequest(request());
        return Inertia::render('reports/StockLedger', [
            'report' => $this->inventoryReport->stockLedger($filters),
            'filters' => $filters->toArray(),
        ]);
    }

    public function lowStock(): Response
    {
        $filters = ReportFilters::fromRequest(request());
        return Inertia::render('reports/LowStockReport', [
            'report' => $this->inventoryReport->lowStock($filters),
            'filters' => $filters->toArray(),
        ]);
    }

    // ─── Contact Reports ──────────────────────────────────────

    public function customerLedger(): Response
    {
        $filters = ReportFilters::fromRequest(request());
        return Inertia::render('reports/CustomerLedger', [
            'report' => $this->contactReport->customerLedger($filters),
            'filters' => $filters->toArray(),
        ]);
    }

    public function supplierLedger(): Response
    {
        $filters = ReportFilters::fromRequest(request());
        return Inertia::render('reports/SupplierLedger', [
            'report' => $this->contactReport->supplierLedger($filters),
            'filters' => $filters->toArray(),
        ]);
    }

    // ─── Day Book ────────────────────────────────────────────

    public function dayBook(): Response
    {
        $preset = request('preset', 'today');
        $dates = $this->resolveDatePreset($preset);

        $filters = ReportFilters::fromRequest(request()->merge([
            'date_from' => $dates['from'],
            'date_to' => $dates['to'],
        ]));

        return Inertia::render('reports/DayBookReport', [
            'report' => $this->dayBookReport->generate($filters),
            'filters' => array_merge($filters->toArray(), ['preset' => $preset]),
        ]);
    }

    private function resolveDatePreset(string $preset): array
    {
        $now = now();
        return match ($preset) {
            'yesterday' => ['from' => $now->copy()->subDay()->format('Y-m-d'), 'to' => $now->copy()->subDay()->format('Y-m-d')],
            'thisWeek' => ['from' => $now->copy()->startOfWeek()->format('Y-m-d'), 'to' => $now->format('Y-m-d')],
            'lastWeek' => ['from' => $now->copy()->subWeek()->startOfWeek()->format('Y-m-d'), 'to' => $now->copy()->subWeek()->endOfWeek()->format('Y-m-d')],
            'lastMonth' => ['from' => $now->copy()->subMonth()->startOfMonth()->format('Y-m-d'), 'to' => $now->copy()->subMonth()->endOfMonth()->format('Y-m-d')],
            'quarter' => ['from' => $now->copy()->startOfQuarter()->format('Y-m-d'), 'to' => $now->format('Y-m-d')],
            'year' => ['from' => $now->copy()->startOfYear()->format('Y-m-d'), 'to' => $now->format('Y-m-d')],
            default => ['from' => $now->format('Y-m-d'), 'to' => $now->format('Y-m-d')], // today
        };
    }

    // ─── Financial Overview ──────────────────────────────────

    public function financialOverview(): Response
    {
        $filters = ReportFilters::fromRequest(request());
        return Inertia::render('reports/FinancialOverview', [
            'report' => $this->financialReport->overview($filters),
            'filters' => $filters->toArray(),
        ]);
    }

    // ─── Product Ledger ──────────────────────────────────────

    public function productTimeline(): Response
    {
        $filters = ReportFilters::fromRequest(request());
        return Inertia::render('reports/ProductLedger', [
            'report' => $this->productReport->timeline($filters),
            'filters' => $filters->toArray(),
        ]);
    }

    // ─── Dashboard ────────────────────────────────────────────

    public function dashboard(): \Illuminate\Http\JsonResponse
    {
        return response()->json($this->dashboardReport->today());
    }

    // ─��─ Legacy Compatibility ─────────────────────────────────
    // These methods maintain backward compatibility with existing
    // route patterns. New code should use the domain-specific methods above.

    public function sales(): Response
    {
        return $this->salesRegister();
    }

    public function purchases(): Response
    {
        return $this->purchaseRegister();
    }

    public function inventory(): Response
    {
        return $this->stockSummary();
    }

    public function financial(): Response
    {
        return Inertia::render('reports/FinancialReport', [
            'report' => (new \App\Domains\Reports\Services\ReportService(
                $this->salesReport,
                $this->purchaseReport,
                $this->inventoryReport,
                $this->dashboardReport,
            ))->getFinancialReport(),
        ]);
    }

    public function profit(): Response
    {
        $filters = ReportFilters::fromRequest(request());
        return Inertia::render('reports/PnLReport', [
            'report' => $this->salesReport->profit($filters),
            'filters' => $filters->toArray(),
        ]);
    }

    // ─── Exports ──────────────────────────────────────────────

    public function exportSalesCsv()
    {
        $filters = ReportFilters::fromRequest(request());
        $data = $this->salesReport->register($filters);
        $rows = array_map(fn($s) => [
            'Invoice' => $s['invoice_number'] ?? '',
            'Date' => $s['date'] ?? '',
            'Customer' => $s['customer']['name'] ?? $s['customer_name'] ?? '',
            'Total' => $s['grand_total'] ?? 0,
            'Paid' => $s['amount_paid'] ?? 0,
            'Status' => $s['payment_status'] ?? '',
        ], $data['sales'] ?? []);
        return $this->export->csv($rows, ['Invoice', 'Date', 'Customer', 'Total', 'Paid', 'Status'], 'sales-register');
    }

    public function exportPurchasesCsv()
    {
        $filters = ReportFilters::fromRequest(request());
        $data = $this->purchaseReport->register($filters);
        $rows = array_map(fn($b) => [
            'Reference' => $b['invoice_ref'] ?? '',
            'Date' => $b['date'] ?? '',
            'Supplier' => $b['supplier']['name'] ?? $b['supplier_name'] ?? '',
            'Total' => $b['total_amount'] ?? 0,
            'Paid' => $b['amount_paid'] ?? 0,
            'Status' => $b['payment_status'] ?? '',
        ], $data['bills'] ?? []);
        return $this->export->csv($rows, ['Reference', 'Date', 'Supplier', 'Total', 'Paid', 'Status'], 'purchase-register');
    }

    public function exportStockCsv()
    {
        $filters = ReportFilters::fromRequest(request());
        $data = $this->inventoryReport->stockSummary($filters);
        $rows = array_map(fn($p) => [
            'Product' => $p['name'] ?? '',
            'SKU' => $p['sku'] ?? '',
            'Category' => $p['category']['name'] ?? '',
            'Stock' => $p['stock_quantity'] ?? 0,
            'Status' => $p['status'] ?? '',
        ], $data['products'] ?? []);
        return $this->export->csv($rows, ['Product', 'SKU', 'Category', 'Stock', 'Status'], 'stock-summary');
    }

    public function exportStockLedgerCsv()
    {
        $filters = ReportFilters::fromRequest(request());
        $data = $this->inventoryReport->stockLedger($filters);
        $rows = array_map(fn($m) => [
            'Date' => $m['date'] ?? '',
            'Product' => $m['product']['name'] ?? '',
            'Type' => $m['type'] ?? '',
            'Quantity' => $m['quantity'] ?? 0,
            'Balance' => $m['running_balance'] ?? 0,
            'Reference' => $m['reference'] ?? '',
        ], $data['movements'] ?? []);
        return $this->export->csv($rows, ['Date', 'Product', 'Type', 'Quantity', 'Balance', 'Reference'], 'stock-ledger');
    }

    public function exportLowStockCsv()
    {
        $filters = ReportFilters::fromRequest(request());
        $data = $this->inventoryReport->lowStock($filters);
        $rows = array_map(fn($p) => [
            'Product' => $p['name'] ?? '',
            'SKU' => $p['sku'] ?? '',
            'Stock' => $p['stock_quantity'] ?? 0,
            'Threshold' => $p['low_stock_threshold'] ?? 0,
            'Status' => $p['status'] ?? '',
        ], $data['products'] ?? []);
        return $this->export->csv($rows, ['Product', 'SKU', 'Stock', 'Threshold', 'Status'], 'low-stock');
    }

    public function exportDayBookCsv()
    {
        $filters = ReportFilters::fromRequest(request());
        $data = $this->dayBookReport->generate($filters);
        $rows = array_map(fn($e) => [
            'Date' => $e['date'] ?? '',
            'Time' => $e['time'] ?? '',
            'Type' => $e['type'] ?? '',
            'Reference' => $e['ref'] ?? '',
            'Description' => $e['description'] ?? '',
            'Party' => $e['party'] ?? '',
            'Amount' => $e['amount'] ?? 0,
        ], $data['events'] ?? []);
        return $this->export->csv($rows, ['Date', 'Time', 'Type', 'Reference', 'Description', 'Party', 'Amount'], 'day-book');
    }
}
