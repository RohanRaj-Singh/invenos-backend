<?php

namespace App\Http\Controllers;

use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\Services\SaleService;
use App\Domains\Settings\Services\SettingService;
use App\Http\Requests\Sales\CreateSaleRequest;
use App\Services\Lifecycle\RecordLifecycleService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function __construct(
        private readonly SaleService $saleService,
        private readonly RecordLifecycleService $lifecycle,
    ) {}

    public function index(): Response
    {
        $search = request('search', '');
        $customerId = request('customer_id') ? (int) request('customer_id') : null;
        $paymentStatus = request('payment_status', '');
        $dateFrom = request('date_from', '');
        $dateTo = request('date_to', '');

        $sales = $this->saleService->search(
            query: $search,
            customerId: $customerId,
            paymentStatus: $paymentStatus,
            dateFrom: $dateFrom,
            dateTo: $dateTo,
            perPage: 25,
        );

        return Inertia::render('sales/SalesList', [
            'sales' => $sales->items(),
            'meta' => [
                'current_page' => $sales->currentPage(),
                'last_page' => $sales->lastPage(),
                'per_page' => $sales->perPage(),
                'total' => $sales->total(),
            ],
            'filters' => ['search' => $search, 'customer_id' => $customerId, 'payment_status' => $paymentStatus, 'date_from' => $dateFrom, 'date_to' => $dateTo],
        ]);
    }

    public function create(): Response
    {
        $products = \App\Models\Product::with('sellingUnits')->orderBy('name')->get()->toArray();
        $customers = \App\Models\Contact::whereJsonContains('roles', 'customer')->orderBy('name')->get(['id', 'name', 'phone'])->toArray();

        return Inertia::render('pos/SaleBill', [
            'products' => $products,
            'customers' => $customers,
        ]);
    }

    public function store(CreateSaleRequest $request): RedirectResponse
    {
        $data = CreateSaleData::fromRequest($request->validated());
        $bypassStock = $request->boolean('bypass_stock_check', false);
        $sale = $this->saleService->create($data, $bypassStock);

        return redirect()->route('sales.show', $sale->id)
            ->with('success', 'Sale created successfully.');
    }

    public function show(int $id): Response
    {
        $sale = $this->saleService->get($id);
        return Inertia::render('sales/SaleDetail', [
            'sale' => $sale->toArray(),
        ]);
    }

    public function printInvoice(int $id): Response
    {
        $sale = $this->saleService->get($id);
        $settings = app(SettingService::class)->get();

        return Inertia::render('sales/SalePrint', [
            'sale' => $sale->toArray(),
            'settings' => $settings,
        ]);
    }

    public function destroy(int $id): RedirectResponse
    {
        $this->authorize('lifecycle.delete-sales');

        $sale = \App\Models\Sale::findOrFail($id);
        $reason = request('reason', 'No reason provided');

        try {
            $this->lifecycle->delete($sale, $reason, auth()->user());
            return redirect()->route('sales.index')
                ->with('success', "Sale {$sale->invoice_number} deleted. Inventory reversed.");
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
