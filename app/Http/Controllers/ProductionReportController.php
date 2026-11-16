<?php

namespace App\Http\Controllers;

use App\Domains\Production\Services\ProductionReportService;
use App\Domains\Reports\DTOs\ReportFilters;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductionReportController extends Controller
{
    public function __construct(
        private readonly ProductionReportService $reports,
    ) {}

    public function componentUsage(Request $request): Response
    {
        $this->authorize('production.view');

        $filters = ReportFilters::fromRequest($request);

        return Inertia::render('production/ComponentUsageReport', [
            'report' => $this->reports->componentUsage($filters),
            'filters' => $filters->toArray(),
        ]);
    }

    public function productionHistory(Request $request): Response
    {
        $this->authorize('production.view');

        $filters = ReportFilters::fromRequest($request);

        return Inertia::render('production/ProductionHistoryReport', [
            'report' => $this->reports->productionHistory($filters),
            'filters' => $filters->toArray(),
        ]);
    }
}
