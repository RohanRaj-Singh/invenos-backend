<?php

namespace App\Http\Controllers;

use App\Domains\Reports\DTOs\ReportFilters;
use App\Domains\Reports\Services\DayBookReportService;
use App\Domains\Reports\Services\ExportService;
use App\Domains\Reports\Services\SalesReportService;
use App\Domains\Reports\Services\PurchaseReportService;
use App\Domains\Reports\Services\InventoryReportService;
use App\Domains\Settings\Services\SettingService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ReportShareController extends Controller
{
    public function __construct(
        private readonly DayBookReportService $dayBook,
        private readonly SalesReportService $sales,
        private readonly PurchaseReportService $purchases,
        private readonly InventoryReportService $inventory,
        private readonly ExportService $export,
        private readonly SettingService $settings,
    ) {}

    public function share(string $report, Request $request): Response
    {
        $format = $request->get('format', 'pdf');
        $filters = ReportFilters::fromRequest($request);
        $data = $this->resolveReport($report, $filters);
        $filename = $report . '-' . now()->format('Ymd-His');

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('reports.pdf', $data);
        $pdfContent = $pdf->output();

        if ($format === 'share') {
            $tempPath = tempnam(sys_get_temp_dir(), 'share_') . '.pdf';
            file_put_contents($tempPath, $pdfContent);
            return response()->json([
                'url' => route('reports.share.download', ['path' => basename($tempPath)]),
                'filename' => "{$filename}.pdf",
            ]);
        }

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}.pdf\"",
        ]);
    }

    private function resolveReport(string $report, ReportFilters $filters): array
    {
        return match ($report) {
            'day-book' => $this->dayBookReportData($filters),
            'sales' => $this->salesReportData($filters),
            'purchases' => $this->purchasesReportData($filters),
            'stock' => $this->stockReportData($filters),
            default => throw new \InvalidArgumentException("Unknown report: {$report}"),
        };
    }

    private function getBusinessSettings(): array
    {
        try {
            return $this->settings->get();
        } catch (\Throwable) {
            return ['business' => ['business_name' => 'Invenos'], 'receipt' => []];
        }
    }

    private function dayBookReportData(ReportFilters $filters): array
    {
        $data = $this->dayBook->generate($filters);
        return [
            'settings' => $this->getBusinessSettings(),
            'title' => 'Day Book',
            'subtitle' => date('d M Y', strtotime($filters->dateFrom ?? now())) . ' — ' . date('d M Y', strtotime($filters->dateTo ?? now())),
            'summary' => $data['summary'] ?? [],
            'closing' => $data['closing_summary'] ?? [],
            'events' => array_map(fn($e) => [
                'time' => $e['time'] ?? '—',
                'type' => $e['type'] ?? '—',
                'ref' => $e['ref'] ?? '—',
                'description' => $e['description'] ?? '—',
                'party' => $e['party'] ?? '—',
                'amount' => $e['amount'] ?? 0,
                'is_financial' => $e['is_financial'] ?? false,
            ], $data['events'] ?? []),
        ];
    }

    private function salesReportData(ReportFilters $filters): array
    {
        $data = $this->sales->register($filters);
        $sales = $data['sales'] ?? [];
        $rows = [];
        foreach ($sales as $s) {
            $a = $this->toArray($s);
            $rows[] = [
                'invoice' => $a['invoice_number'] ?? '—',
                'date' => $a['date'] ?? '—',
                'customer' => $a['customer_name'] ?? ($a['customer']['name'] ?? 'Walk-in'),
                'total' => (float) ($a['grand_total'] ?? 0),
                'paid' => (float) ($a['amount_paid'] ?? 0),
                'status' => $a['payment_status'] ?? '—',
            ];
        }
        return [
            'settings' => $this->getBusinessSettings(),
            'title' => 'Sales Report',
            'subtitle' => date('d M Y', strtotime($filters->dateFrom ?? now())) . ' — ' . date('d M Y', strtotime($filters->dateTo ?? now())),
            'summary' => $data['summary'] ?? [],
            'rows' => $rows,
        ];
    }

    private function purchasesReportData(ReportFilters $filters): array
    {
        $data = $this->purchases->register($filters);
        $bills = $data['bills'] ?? [];
        $rows = [];
        foreach ($bills as $b) {
            $a = $this->toArray($b);
            $rows[] = [
                'ref' => $a['invoice_ref'] ?? '—',
                'date' => $a['date'] ?? '—',
                'supplier' => $a['supplier_name'] ?? ($a['supplier']['name'] ?? '—'),
                'total' => (float) ($a['total_amount'] ?? 0),
                'paid' => (float) ($a['amount_paid'] ?? 0),
                'status' => $a['payment_status'] ?? '—',
            ];
        }
        return [
            'settings' => $this->getBusinessSettings(),
            'title' => 'Purchase Report',
            'subtitle' => date('d M Y', strtotime($filters->dateFrom ?? now())) . ' — ' . date('d M Y', strtotime($filters->dateTo ?? now())),
            'summary' => $data['summary'] ?? [],
            'rows' => $rows,
        ];
    }

    private function stockReportData(ReportFilters $filters): array
    {
        // Full filtered dataset — never a single pagination page.
        $data = $this->inventory->stockReport(new ReportFilters(
            dateFrom: $filters->dateFrom,
            dateTo: $filters->dateTo,
            categoryId: $filters->categoryId,
            status: $filters->status,
            search: $filters->search,
            perPage: 0,
        ));

        $rows = [];
        foreach ($data['products'] ?? [] as $p) {
            $rows[] = [
                'product' => $p['name'] ?? '—',
                'sku' => $p['sku'] ?? '—',
                'category' => $p['category'] ?? '—',
                'unit' => $p['unit'] ?? '—',
                'stock' => (float) ($p['stock_quantity'] ?? 0),
                'threshold' => (float) ($p['low_stock_threshold'] ?? 0),
                'sold' => (float) ($p['sold'] ?? 0),
                'purchased' => (float) ($p['purchased'] ?? 0),
                'value' => (float) ($p['value'] ?? 0),
                'status' => $p['status'] ?? '—',
            ];
        }

        return [
            'settings' => $this->getBusinessSettings(),
            'title' => 'Stock Report',
            'subtitle' => 'Inventory levels & movement — ' . date('d M Y', strtotime($data['period']['from'])) . ' to ' . date('d M Y', strtotime($data['period']['to'])),
            'summary' => $data['summary'] ?? [],
            'movement' => $data['movement'] ?? [],
            'attention' => $data['attention'] ?? [],
            'valuation' => $data['valuation'] ?? [],
            'rows' => $rows,
        ];
    }

    private function toArray(mixed $item): array
    {
        if (is_array($item)) return $item;
        if (method_exists($item, 'toArray')) return $item->toArray();
        return (array) $item;
    }
}