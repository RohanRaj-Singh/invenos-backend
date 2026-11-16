<?php

namespace App\Http\Controllers;

use App\Domains\Composition\Exceptions\InsufficientComponentStockException;
use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\Services\SaleService;
use App\Domains\Settings\Services\SettingService;
use App\Http\Requests\Sales\CreateSaleRequest;
use App\Models\Contact;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\Sale;
use App\Services\Lifecycle\RecordLifecycleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
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

        $perPage = (int) request('per_page', 25);
        $perPage = $perPage >= 1 ? min($perPage, 1000) : 25;

        $sales = $this->saleService->search(
            query: $search,
            customerId: $customerId,
            paymentStatus: $paymentStatus,
            dateFrom: $dateFrom,
            dateTo: $dateTo,
            perPage: $perPage,
        );

        return Inertia::render('sales/SalesList', [
            'sales' => $sales->items(),
            'meta' => [
                'current_page' => $sales->currentPage(),
                'last_page' => $sales->lastPage(),
                'per_page' => $sales->perPage(),
                'total' => $sales->total(),
            ],
            'filters' => ['search' => $search, 'customer_id' => $customerId, 'payment_status' => $paymentStatus, 'date_from' => $dateFrom, 'date_to' => $dateTo, 'per_page' => $perPage],
        ]);
    }

    public function create(): Response
    {
        $products = Product::query()
            ->with('sellingUnits')
            ->addSelect([
                'consumption_composition_version' => ProductComposition::query()
                    ->select('version')
                    ->whereColumn('product_id', 'products.id')
                    ->where('kind', ProductComposition::KIND_CONSUMPTION)
                    ->where('is_active', true)
                    ->orderByDesc('version')
                    ->limit(1),
            ])
            ->withExists([
                'compositions as has_consumption_composition' => fn ($query) => $query
                    ->where('kind', ProductComposition::KIND_CONSUMPTION)
                    ->where('is_active', true),
            ])
            ->orderBy('name')
            ->get()
            ->toArray();

        $customers = Contact::whereJsonContains('roles', 'customer')->orderBy('name')->get(['id', 'name', 'phone'])->toArray();

        return Inertia::render('pos/SaleBill', [
            'products' => $products,
            'customers' => $customers,
            // The POS only requests a profitability preview when the server says
            // this user may see cost; hiding it in the UI would not be enough.
            'can_view_cost' => Gate::allows('cost', ProductComposition::class),
        ]);
    }

    public function store(CreateSaleRequest $request): RedirectResponse
    {
        $this->authorize('sales.create');

        $data = CreateSaleData::fromRequest($request->validated());
        $bypassStock = $request->boolean('bypass_stock_check', false);

        try {
            $sale = $this->saleService->create($data, $bypassStock);
        } catch (InsufficientComponentStockException $exception) {
            throw ValidationException::withMessages([
                'items' => $exception->getMessage(),
            ]);
        }

        return redirect()->route('sales.show', $sale->id)
            ->with('success', 'Sale created successfully.');
    }

    public function show(int $id): Response
    {
        $sale = $this->saleService->get($id);

        return Inertia::render('sales/SaleDetail', [
            'sale' => $this->saleForDisplay($sale),
        ]);
    }

    public function printInvoice(int $id): Response
    {
        $sale = $this->saleService->get($id);
        $settings = app(SettingService::class)->get();

        return Inertia::render('sales/SalePrint', [
            'sale' => $this->saleForDisplay($sale),
            'settings' => $settings,
        ]);
    }

    /**
     * Customer-facing sale payload: keeps immutable component quantities for
     * staff visibility but never exposes internal run costs.
     */
    private function saleForDisplay(Sale $sale): array
    {
        $data = $sale->toArray();
        $runs = $data['composition_runs'] ?? [];

        // Line cost is financial data: it follows the same permission as
        // composition cost, and is stripped entirely rather than nulled.
        $canViewCost = Gate::allows('cost', ProductComposition::class);

        if (! $canViewCost) {
            $data['items'] = array_map(function (array $item): array {
                unset($item['cost_price'], $item['cost_complete'], $item['uncosted_quantity']);

                return $item;
            }, $data['items'] ?? []);
        }

        $data['composition_runs'] = array_map(function (array $run) use ($canViewCost): array {
            $snapshot = $run['template_snapshot'] ?? [];

            return [
                'id' => $run['id'],
                'run_number' => $run['run_number'],
                'sale_item_id' => $run['sale_item_id'] ?? null,
                'status' => $run['status'],
                'reference' => $run['reference'] ?? null,
                'formula_name' => $snapshot['name'] ?? null,
                'template_version' => $run['template_version'] ?? null,
                'quantity' => $run['quantity'] ?? null,
                'output_quantity' => $run['output_quantity'] ?? null,
                'items' => array_map(fn (array $item): array => [
                    'id' => $item['id'],
                    'component_name' => $item['component_name'] ?? null,
                    'component_sku' => $item['component_sku'] ?? null,
                    'unit' => $item['unit'],
                    'actual_quantity' => $item['actual_quantity'],
                    'template_quantity' => $item['template_quantity'],
                    ...($canViewCost ? ['cost_basis' => $item['cost_basis'] ?? null] : []),
                ], $run['items'] ?? []),
            ];
        }, $runs);

        return $data;
    }

    public function destroy(int $id): RedirectResponse
    {
        $this->authorize('lifecycle.delete-sales');

        $sale = Sale::findOrFail($id);
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
