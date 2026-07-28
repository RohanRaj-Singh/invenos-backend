<?php

namespace App\Http\Controllers;

use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\Services\SaleService;
use App\Domains\Settings\Services\SettingService;
use App\Http\Requests\Sales\CreateSaleRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function __construct(
        private readonly SaleService $saleService,
    ) {}

    public function index(): Response
    {
        $search = request('search', '');
        $customerId = request('customer_id') ? (int) request('customer_id') : null;
        $paymentStatus = request('payment_status', '');

        $sales = $this->saleService->search(
            query: $search,
            customerId: $customerId,
            paymentStatus: $paymentStatus,
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
            'filters' => ['search' => $search, 'customer_id' => $customerId, 'payment_status' => $paymentStatus],
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
        $sale = $this->saleService->create($data);

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
        $this->saleService->delete($id);
        return redirect()->route('sales.index')
            ->with('success', 'Sale deleted.');
    }
}
