<?php

namespace App\Http\Controllers;

use App\Domains\Composition\Exceptions\InsufficientComponentStockException;
use App\Domains\Production\Services\ProductionService;
use App\Http\Requests\Production\ExecuteProductionRequest;
use App\Http\Requests\Production\ReverseProductionRequest;
use App\Http\Requests\Production\StoreProductionOrderRequest;
use App\Http\Requests\Production\UpdateProductionOrderRequest;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\ProductionOrder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ProductionController extends Controller
{
    public function __construct(
        private readonly ProductionService $production,
    ) {}

    public function index(): Response
    {
        $this->authorize('production.view');

        $orders = ProductionOrder::with(['product', 'composition'])
            ->when(request('status'), fn ($q, $status) => $q->where('status', $status))
            ->when(request('search'), function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('production_number', 'like', "%{$search}%")
                        ->orWhere('reference', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('production/ProductionList', [
            'orders' => $orders->items(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
            'filters' => [
                'status' => request('status', ''),
                'search' => request('search', ''),
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('production.manage');

        $products = Product::query()
            ->where('track_inventory', true)
            ->whereHas('compositions', fn ($q) => $q
                ->where('kind', ProductComposition::KIND_ASSEMBLY)
                ->where('is_active', true))
            ->with([
                'compositions' => fn ($q) => $q
                    ->where('kind', ProductComposition::KIND_ASSEMBLY)
                    ->where('is_active', true)
                    ->with('items.component'),
            ])
            ->orderBy('name')
            ->get();

        return Inertia::render('production/ProductionCreate', [
            'products' => $products,
            'locations' => Product::query()
                ->whereNotNull('location')
                ->where('location', '!=', '')
                ->distinct()
                ->orderBy('location')
                ->pluck('location'),
            'default_date' => now()->format('Y-m-d'),
        ]);
    }

    public function store(StoreProductionOrderRequest $request): RedirectResponse
    {
        $this->authorize('production.manage');

        $order = $this->production->create(
            $request->validated(),
            $request->user()?->name,
        );

        return redirect()->route('production.show', $order->id)
            ->with('success', 'Production order created.');
    }

    public function show(int $id): Response
    {
        $this->authorize('production.view');

        $order = ProductionOrder::with([
            'product',
            'composition.items.component',
            'compositionRun.items.component',
            'finishedInventoryTransaction',
            'reversalInventoryTransaction',
        ])->findOrFail($id);

        return Inertia::render('production/ProductionDetail', [
            'order' => $order,
            'canManage' => request()->user()?->can('production.manage') ?? false,
        ]);
    }

    public function update(UpdateProductionOrderRequest $request, int $id): RedirectResponse
    {
        $this->authorize('production.manage');

        $order = $this->production->updateDraft(
            ProductionOrder::findOrFail($id),
            $request->validated(),
            $request->user()?->name,
        );

        return redirect()->route('production.show', $order->id)
            ->with('success', 'Draft production order updated.');
    }

    public function start(int $id): RedirectResponse
    {
        $this->authorize('production.manage');

        $order = $this->production->start(ProductionOrder::findOrFail($id));

        return back()->with('success', "Production {$order->production_number} started.");
    }

    public function cancel(int $id): RedirectResponse
    {
        $this->authorize('production.manage');

        $order = $this->production->cancel(ProductionOrder::findOrFail($id));

        return back()->with('success', "Production {$order->production_number} cancelled.");
    }

    public function execute(ExecuteProductionRequest $request, int $id): RedirectResponse
    {
        $this->authorize('production.manage');

        try {
            $order = $this->production->execute(
                ProductionOrder::findOrFail($id),
                (float) $request->validated('actual_output_quantity'),
                $request->validated('output_unit_id'),
                $request->validated('idempotency_key'),
                $request->user()?->name,
                $request->user()?->id,
                $request->validated('document_date'),
                $request->validated('location'),
            );
        } catch (InsufficientComponentStockException $exception) {
            throw ValidationException::withMessages([
                'items' => $exception->getMessage(),
            ]);
        }

        return redirect()->route('production.show', $order->id)
            ->with('success', "Production {$order->production_number} completed.");
    }

    public function reverse(ReverseProductionRequest $request, int $id): RedirectResponse
    {
        $this->authorize('production.manage');

        $order = $this->production->reverse(
            ProductionOrder::findOrFail($id),
            $request->validated('idempotency_key'),
            $request->user()?->name,
            $request->user()?->id,
        );

        return redirect()->route('production.show', $order->id)
            ->with('success', "Production {$order->production_number} reversed.");
    }
}
