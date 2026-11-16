<?php

namespace App\Domains\Production\Services;

use App\Domains\Reports\DTOs\ReportFilters;
use App\Models\ProductionOrder;
use Illuminate\Support\Facades\DB;

class ProductionReportService
{
    public function componentUsage(ReportFilters $filters): array
    {
        $from = $filters->dateFrom ?? now()->startOfMonth()->format('Y-m-d');
        $to = $filters->dateTo ?? now()->format('Y-m-d');

        $manufacturing = DB::table('production_orders as po')
            ->join('composition_runs as cr', 'cr.id', '=', 'po.composition_run_id')
            ->join('composition_run_items as cri', 'cri.composition_run_id', '=', 'cr.id')
            ->join('products as fp', 'fp.id', '=', 'po.product_id')
            ->whereIn('po.status', [ProductionOrder::STATUS_COMPLETED, ProductionOrder::STATUS_REVERSED])
            ->whereBetween(DB::raw('COALESCE(po.completed_at, po.created_at)'), [$from.' 00:00:00', $to.' 23:59:59'])
            ->when($filters->productId, fn ($q) => $q->where('cri.component_product_id', $filters->productId))
            ->when($filters->location, fn ($q) => $q->where('po.location', $filters->location))
            ->when($filters->search, function ($q) use ($filters) {
                $search = '%'.$filters->search.'%';
                $q->where(function ($q) use ($search) {
                    $q->where('po.production_number', 'like', $search)
                        ->orWhere('cri.component_name', 'like', $search)
                        ->orWhere('fp.name', 'like', $search);
                });
            })
            ->select([
                'po.id as production_id',
                'po.production_number as document_number',
                'po.completed_at as date',
                'po.location',
                'po.status',
                'po.actual_output_base_quantity as production_output_quantity',
                'po.total_cost as production_total_cost',
                'po.cost_complete as production_cost_complete',
                'po.product_id as finished_product_id',
                'fp.name as finished_product_name',
                'cri.component_product_id',
                'cri.component_name',
                'cri.unit',
                'cri.actual_quantity',
                'cri.template_quantity',
                'cri.unit_cost',
                'cri.total_cost',
                'cri.cost_basis',
            ])
            ->get()
            ->map(fn ($row) => $this->row(
                source: 'manufacturing',
                row: $row,
                documentNumber: $row->document_number,
                date: $row->date,
                finishedProductId: $row->finished_product_id,
                finishedProductName: $row->finished_product_name,
                productionOutputQuantity: $row->production_output_quantity,
                productionTotalCost: $row->production_total_cost,
                productionCostComplete: (bool) $row->production_cost_complete,
                location: $row->location,
                status: $row->status,
                productionId: $row->production_id,
            ));

        $pos = DB::table('composition_runs as cr')
            ->join('composition_run_items as cri', 'cri.composition_run_id', '=', 'cr.id')
            ->join('sale_items as si', 'si.id', '=', 'cr.sale_item_id')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->where('cr.source_type', 'sale')
            ->where('cr.status', 'completed')
            ->whereNull('s.deleted_at')
            ->whereBetween('s.date', [$from, $to])
            ->when($filters->productId, fn ($q) => $q->where('cri.component_product_id', $filters->productId))
            ->when($filters->location, fn ($q) => $q->where('cr.location', $filters->location))
            ->when($filters->search, function ($q) use ($filters) {
                $search = '%'.$filters->search.'%';
                $q->where(function ($q) use ($search) {
                    $q->where('s.invoice_number', 'like', $search)
                        ->orWhere('cri.component_name', 'like', $search)
                        ->orWhere('si.product_name', 'like', $search);
                });
            })
            ->select([
                'cr.id as production_id',
                's.invoice_number as document_number',
                's.date as date',
                'cr.location',
                'cr.status',
                'si.product_id as finished_product_id',
                'si.product_name as finished_product_name',
                'cri.component_product_id',
                'cri.component_name',
                'cri.unit',
                'cri.actual_quantity',
                'cri.template_quantity',
                'cri.unit_cost',
                'cri.total_cost',
                'cri.cost_basis',
            ])
            ->get()
            ->map(fn ($row) => $this->row(
                source: 'pos',
                row: $row,
                documentNumber: $row->document_number,
                date: $row->date,
                finishedProductId: $row->finished_product_id,
                finishedProductName: $row->finished_product_name,
                productionOutputQuantity: null,
                productionTotalCost: null,
                productionCostComplete: $row->total_cost !== null,
                location: $row->location,
                status: $row->status,
                productionId: null,
            ));

        $recoveries = DB::table('return_component_recoveries as rcr')
            ->join('returns as r', 'r.id', '=', 'rcr.return_id')
            ->whereNotNull('rcr.restored_at')
            ->where('r.status', 'completed')
            ->whereNull('r.deleted_at')
            ->whereBetween('r.return_date', [$from, $to])
            ->when($filters->productId, fn ($q) => $q->where('rcr.component_product_id', $filters->productId))
            ->when($filters->search, function ($q) use ($filters) {
                $search = '%'.$filters->search.'%';
                $q->where(function ($q) use ($search) {
                    $q->where('r.return_number', 'like', $search)
                        ->orWhere('rcr.component_name', 'like', $search);
                });
            })
            ->select([
                'rcr.id as production_id',
                'r.return_number as document_number',
                'r.return_date as date',
                'rcr.component_product_id',
                'rcr.component_name',
                'rcr.unit',
                'rcr.recovered_quantity as actual_quantity',
                'rcr.unit_cost',
                'rcr.total_cost',
            ])
            ->get()
            ->map(fn ($row) => [
                'source' => 'recovery',
                'production_id' => null,
                'document_number' => $row->document_number,
                'date' => $row->date,
                'finished_product_id' => null,
                'finished_product_name' => null,
                'component_product_id' => (int) $row->component_product_id,
                'component_name' => $row->component_name,
                'unit' => $row->unit,
                'actual_quantity' => (float) $row->actual_quantity,
                'template_quantity' => 0.0,
                'wastage_quantity' => 0.0,
                'unit_cost' => $row->unit_cost === null ? null : (float) $row->unit_cost,
                'total_cost' => $row->total_cost === null ? null : (float) $row->total_cost,
                'cost_basis' => null,
                'production_output_quantity' => null,
                'production_total_cost' => null,
                'production_cost_complete' => $row->total_cost !== null,
                'location' => null,
                'status' => 'completed',
            ]);

        $rows = $manufacturing->concat($pos)->concat($recoveries)
            ->sortByDesc(fn ($row) => $row['date'])
            ->values();

        $manufacturingRows = $rows->where('source', 'manufacturing');
        $posRows = $rows->where('source', 'pos');
        $recoveryRows = $rows->where('source', 'recovery');

        $productionOrders = $manufacturingRows->unique('production_id');

        $summary = [
            'manufacturing_quantity' => round((float) $manufacturingRows->sum('actual_quantity'), 6),
            'pos_quantity' => round((float) $posRows->sum('actual_quantity'), 6),
            'recovered_quantity' => round((float) $recoveryRows->sum('actual_quantity'), 6),
            'net_component_quantity' => round(
                (float) $manufacturingRows->sum('actual_quantity')
                + (float) $posRows->sum('actual_quantity')
                - (float) $recoveryRows->sum('actual_quantity'),
                6,
            ),
            'production_output_quantity' => round((float) $productionOrders->sum('production_output_quantity'), 6),
            'production_cost' => round((float) $productionOrders->sum('production_total_cost'), 6),
            'cost_complete' => $rows->every(fn ($row) => $row['production_cost_complete'] && $row['total_cost'] !== null),
            'uncosted_component_lines' => $rows->whereNull('total_cost')->count(),
            'row_count' => $rows->count(),
        ];

        $byComponent = $rows->groupBy(fn ($row) => $row['component_product_id'].':'.$row['unit'])
            ->map(function ($group) {
                $first = $group->first();

                return [
                    'component_product_id' => $first['component_product_id'],
                    'component_name' => $first['component_name'],
                    'unit' => $first['unit'],
                    'manufacturing_quantity' => round((float) $group->where('source', 'manufacturing')->sum('actual_quantity'), 6),
                    'pos_quantity' => round((float) $group->where('source', 'pos')->sum('actual_quantity'), 6),
                    'recovered_quantity' => round((float) $group->where('source', 'recovery')->sum('actual_quantity'), 6),
                    'total_cost' => round((float) $group->sum(fn ($row) => (float) ($row['total_cost'] ?? 0)), 6),
                    'cost_complete' => $group->every(fn ($row) => $row['production_cost_complete'] && $row['total_cost'] !== null),
                ];
            })
            ->values()
            ->all();

        return [
            'period' => ['from' => $from, 'to' => $to],
            'rows' => $rows->all(),
            'summary' => $summary,
            'by_component' => $byComponent,
            'generated_at' => now()->toDateTimeString(),
        ];
    }

    public function productionHistory(ReportFilters $filters): array
    {
        $from = $filters->dateFrom ?? now()->startOfMonth()->format('Y-m-d');
        $to = $filters->dateTo ?? now()->format('Y-m-d');

        $orders = ProductionOrder::with(['product', 'composition', 'compositionRun.items'])
            ->whereBetween(DB::raw('COALESCE(completed_at, created_at)'), [$from.' 00:00:00', $to.' 23:59:59'])
            ->when($filters->productId, fn ($q) => $q->where('product_id', $filters->productId))
            ->when($filters->location, fn ($q) => $q->where('location', $filters->location))
            ->when($filters->status, fn ($q) => $q->where('status', $filters->status))
            ->when($filters->search, function ($q) use ($filters) {
                $search = '%'.$filters->search.'%';
                $q->where(function ($q) use ($search) {
                    $q->where('production_number', 'like', $search)
                        ->orWhere('reference', 'like', $search);
                });
            })
            ->orderByDesc('created_at')
            ->get();

        return [
            'period' => ['from' => $from, 'to' => $to],
            'orders' => $orders,
            'summary' => [
                'order_count' => $orders->count(),
                'completed_count' => $orders->where('status', ProductionOrder::STATUS_COMPLETED)->count(),
                'reversed_count' => $orders->where('status', ProductionOrder::STATUS_REVERSED)->count(),
                'output_quantity' => round((float) $orders->sum('actual_output_base_quantity'), 6),
                'production_cost' => round((float) $orders->sum('total_cost'), 6),
                'cost_complete' => $orders->every(fn (ProductionOrder $order) => (bool) $order->cost_complete),
            ],
        ];
    }

    private function row(
        string $source,
        object $row,
        ?string $documentNumber,
        mixed $date,
        ?int $finishedProductId,
        ?string $finishedProductName,
        ?float $productionOutputQuantity,
        ?float $productionTotalCost,
        bool $productionCostComplete,
        ?string $location,
        ?string $status,
        ?int $productionId,
    ): array {
        $template = (float) ($row->template_quantity ?? 0);
        $actual = (float) ($row->actual_quantity ?? 0);

        return [
            'source' => $source,
            'production_id' => $productionId,
            'document_number' => $documentNumber,
            'date' => $date,
            'finished_product_id' => $finishedProductId,
            'finished_product_name' => $finishedProductName,
            'component_product_id' => (int) $row->component_product_id,
            'component_name' => $row->component_name,
            'unit' => $row->unit,
            'actual_quantity' => $actual,
            'template_quantity' => $template,
            'wastage_quantity' => round(max(0, $actual - $template), 6),
            'unit_cost' => $row->unit_cost === null ? null : (float) $row->unit_cost,
            'total_cost' => $row->total_cost === null ? null : (float) $row->total_cost,
            'cost_basis' => $row->cost_basis,
            'production_output_quantity' => $productionOutputQuantity,
            'production_total_cost' => $productionTotalCost,
            'production_cost_complete' => $productionCostComplete,
            'location' => $location,
            'status' => $status,
        ];
    }
}
