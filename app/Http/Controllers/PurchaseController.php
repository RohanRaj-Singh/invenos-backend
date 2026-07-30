<?php

namespace App\Http\Controllers;

use App\Domains\Purchasing\DTOs\CreatePurchaseData;
use App\Domains\Purchasing\Services\PurchaseService;
use App\Domains\Settings\Services\SettingService;
use App\Http\Requests\Purchases\CreatePurchaseRequest;
use App\Services\Lifecycle\RecordLifecycleService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseController extends Controller
{
    public function __construct(
        private readonly PurchaseService $purchaseService,
        private readonly RecordLifecycleService $lifecycle,
    ) {}

    public function index(): Response
    {
        $search = request('search', '');
        $supplierId = request('supplier_id') ? (int) request('supplier_id') : null;
        $status = request('status', '');
        $dateFrom = request('date_from', '');
        $dateTo = request('date_to', '');

        $purchases = $this->purchaseService->search(
            query: $search,
            supplierId: $supplierId,
            status: $status,
            dateFrom: $dateFrom,
            dateTo: $dateTo,
            perPage: 25,
        );

        return Inertia::render('purchases/PurchasesList', [
            'purchases' => $purchases->items(),
            'meta' => [
                'current_page' => $purchases->currentPage(),
                'last_page' => $purchases->lastPage(),
                'per_page' => $purchases->perPage(),
                'total' => $purchases->total(),
            ],
            'filters' => ['search' => $search, 'supplier_id' => $supplierId, 'status' => $status, 'date_from' => $dateFrom, 'date_to' => $dateTo],
        ]);
    }

    public function create(): Response
    {
        $products = \App\Models\Product::with('sellingUnits')->orderBy('name')->get()->toArray();
        $suppliers = \App\Models\Contact::whereJsonContains('roles', 'supplier')->orderBy('name')->get(['id', 'name', 'phone', 'email', 'current_balance', 'opening_balance', 'balance_type'])->toArray();

        return Inertia::render('purchases/PurchaseBill', [
            'products' => $products,
            'suppliers' => $suppliers,
        ]);
    }

    public function store(CreatePurchaseRequest $request): RedirectResponse
    {
        $data = CreatePurchaseData::fromRequest($request->validated());
        $purchase = $this->purchaseService->create($data);

        return redirect()->route('purchases.show', $purchase->id)
            ->with('success', 'Purchase created successfully.');
    }

    public function show(int $id): Response
    {
        $purchase = $this->purchaseService->get($id);

        $returns = [];

        return Inertia::render('purchases/PurchaseDetail', [
            'purchase' => $purchase->toArray(),
            'returns' => $returns,
        ]);
    }

    public function printBill(int $id): Response
    {
        $purchase = $this->purchaseService->get($id);
        $settings = app(SettingService::class)->get();

        return Inertia::render('purchases/PurchasePrint', [
            'purchase' => $purchase->toArray(),
            'settings' => $settings,
        ]);
    }

    public function destroy(int $id): RedirectResponse
    {
        $this->authorize('lifecycle.delete-purchases');

        $purchase = \App\Models\PurchaseBill::findOrFail($id);
        $reason = request('reason', 'No reason provided');

        try {
            $this->lifecycle->delete($purchase, $reason, auth()->user());
            return redirect()->route('purchases.index')
                ->with('success', "Purchase {$purchase->invoice_ref} deleted. Inventory reversed.");
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
