<?php

namespace App\Http\Controllers;

use App\Domains\Composition\DTOs\CompositionItemOverrideData;
use App\Domains\Composition\DTOs\ExecuteCompositionData;
use App\Domains\Composition\Exceptions\InsufficientComponentStockException;
use App\Domains\Composition\Services\CompositionCostCalculator;
use App\Domains\Composition\Services\CompositionExecutionService;
use App\Domains\Composition\Services\CompositionPayloadMapper;
use App\Domains\Composition\Services\CompositionPricingService;
use App\Domains\Composition\Services\CompositionService;
use App\Domains\Composition\Services\CompositionValidator;
use App\Domains\Composition\Services\PosFormulaProfitabilityService;
use App\Domains\Products\Services\ProductUnitService;
use App\Http\Requests\Composition\ComponentSearchRequest;
use App\Http\Requests\Composition\ComponentUnitRequest;
use App\Http\Requests\Composition\DraftCompositionPreviewRequest;
use App\Http\Requests\Composition\ExecuteCompositionRequest;
use App\Http\Requests\Composition\PreviewProfitabilityRequest;
use App\Http\Requests\Composition\SaveCompositionRequest;
use App\Http\Resources\CompositionRunResource;
use App\Http\Resources\ProductCompositionResource;
use App\Models\Product;
use App\Models\ProductComposition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CompositionController extends Controller
{
    public function __construct(
        private readonly CompositionService $compositions,
        private readonly CompositionValidator $validator,
        private readonly CompositionPayloadMapper $mapper,
        private readonly CompositionCostCalculator $costs,
        private readonly ProductUnitService $units,
        private readonly PosFormulaProfitabilityService $profitability,
    ) {}

    public function index(Product $product): JsonResponse
    {
        $this->authorize('view', ProductComposition::class);

        $compositions = ProductComposition::query()
            ->where('product_id', $product->id)
            ->with(['items.component', 'product.sellingUnits'])
            ->orderByDesc('version')
            ->get();

        return response()->json([
            'data' => $compositions->map(
                fn (ProductComposition $composition) => (
                    new ProductCompositionResource(
                        $composition,
                        $this->costs->estimateComposition($composition),
                    )
                )->resolve()
            )->values()->all(),
        ]);
    }

    public function active(Request $request, Product $product): JsonResponse
    {
        $this->authorize('view', ProductComposition::class);

        $validated = $request->validate([
            'kind' => ['required', Rule::in(ProductComposition::KINDS)],
        ]);

        $composition = $this->compositions->getActive($product->id, $validated['kind']);

        if ($composition === null) {
            return response()->json(['data' => null]);
        }

        return $this->respond($composition);
    }

    public function show(Product $product, ProductComposition $composition): JsonResponse
    {
        $this->authorize('view', ProductComposition::class);
        $this->ensureBelongs($product, $composition);

        return $this->respond($composition);
    }

    public function store(SaveCompositionRequest $request, Product $product): JsonResponse
    {
        $this->authorize('manage', ProductComposition::class);

        $data = $this->mapper->toSaveData($request->validated(), $product->id);
        $composition = $this->compositions->save($data, $request->user()?->name);

        return $this->respond($composition, 201);
    }

    public function update(
        SaveCompositionRequest $request,
        Product $product,
        ProductComposition $composition,
    ): JsonResponse {
        $this->authorize('manage', ProductComposition::class);
        $this->ensureBelongs($product, $composition);

        $data = $this->mapper->toSaveData($request->validated(), $product->id);
        $updated = $this->compositions->update($composition, $data, $request->user()?->name);

        return $this->respond($updated);
    }

    public function deactivate(Product $product, ProductComposition $composition): JsonResponse
    {
        $this->authorize('manage', ProductComposition::class);
        $this->ensureBelongs($product, $composition);

        return $this->respond($this->compositions->deactivate($composition->id));
    }

    /**
     * Read-only profitability for a POS formula line with runtime quantities.
     *
     * Informational only: no locks, no writes, and never used by checkout.
     */
    public function costPreview(
        PreviewProfitabilityRequest $request,
        Product $product,
    ): JsonResponse {
        $this->authorize('view', ProductComposition::class);
        // The whole payload is cost-derived, so it needs the cost permission.
        $this->authorize('cost', ProductComposition::class);

        $data = $request->validated();

        $composition = isset($data['composition_id'])
            ? ProductComposition::query()
                ->where('product_id', $product->id)
                ->whereKey($data['composition_id'])
                ->first()
            : $this->compositions->getActive($product->id, ProductComposition::KIND_CONSUMPTION);

        if (
            $composition === null
            || ! $composition->is_active
            || $composition->kind !== ProductComposition::KIND_CONSUMPTION
        ) {
            throw ValidationException::withMessages([
                'composition_id' => 'This product has no active formula to preview.',
            ]);
        }

        $product->loadMissing('sellingUnits');

        $overrides = array_map(
            fn (array $override) => CompositionItemOverrideData::fromArray($override),
            $data['overrides'] ?? [],
        );

        return response()->json([
            'data' => $this->profitability->preview(
                product: $product,
                composition: $composition,
                quantity: (float) $data['quantity'],
                sellingUnitId: isset($data['selling_unit_id']) ? (int) $data['selling_unit_id'] : null,
                unitPrice: isset($data['unit_price']) ? (float) $data['unit_price'] : null,
                discountPercent: (float) ($data['discount_percent'] ?? 0),
                discountAmount: isset($data['discount_amount']) ? (float) $data['discount_amount'] : null,
                overrides: $overrides,
                optionalItemIds: array_map('intval', $data['optional_item_ids'] ?? []),
            ),
        ]);
    }

    public function preview(SaveCompositionRequest $request, Product $product): JsonResponse
    {
        $this->authorize('view', ProductComposition::class);
        // The whole response is cost data, so it needs the cost permission too;
        // otherwise a viewer could bypass the resource-level withholding.
        $this->authorize('cost', ProductComposition::class);

        $data = $this->mapper->toSaveData($request->validated(), $product->id);
        $this->validator->validate($data);

        $estimate = $this->costs->estimate($data);

        // Pricing guidance rides along so the builder never has to reimplement
        // the margin maths on the client.
        $product->loadMissing('sellingUnits');
        $sellingUnit = $product->sellingUnits->firstWhere('is_default', true)
            ?? $product->sellingUnits->first();
        $estimate['pricing'] = app(CompositionPricingService::class)
            ->summarizeFromCost($estimate, $sellingUnit);

        return response()->json(['data' => $estimate]);
    }

    /**
     * Live costing for a formula that has not been saved yet. The create screen
     * needs a cost while ingredients are being entered, and there is no product
     * id to scope `preview` to; nothing is persisted and no product is required.
     */
    public function draftPreview(DraftCompositionPreviewRequest $request): JsonResponse
    {
        $this->authorize('cost', ProductComposition::class);

        $validated = $request->validated();
        $data = $this->mapper->toSaveData($validated, 0);

        return response()->json([
            'data' => $this->costs->estimateDraft(
                $data->items,
                $data->outputQuantity,
                $data->outputUnitId,
                (string) ($validated['base_unit_id'] ?? 'piece'),
            ),
        ]);
    }

    public function execute(
        ExecuteCompositionRequest $request,
        Product $product,
        ProductComposition $composition,
        CompositionExecutionService $executions,
    ): JsonResponse {
        $this->authorize('manage', ProductComposition::class);
        $this->ensureBelongs($product, $composition);

        $data = ExecuteCompositionData::fromArray([
            'composition_id' => $composition->id,
            'quantity' => $request->validated('quantity'),
            'quantity_unit_id' => $request->validated('quantity_unit_id'),
            'source_type' => $request->validated('source_type'),
            'source_id' => $request->validated('source_id'),
            'reference' => $request->validated('reference'),
            'idempotency_key' => $request->validated('idempotency_key'),
            'created_by' => $request->user()?->name,
            'user_id' => $request->user()?->id,
            'location' => $request->validated('location'),
            'document_date' => $request->validated('document_date'),
            'optional_item_ids' => $request->validated('optional_item_ids') ?? [],
            'overrides' => $request->validated('overrides') ?? [],
        ]);

        try {
            $run = $executions->execute($data);
        } catch (InsufficientComponentStockException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'errors' => ['items' => [$exception->getMessage()]],
                'component' => $exception->context(),
            ], 422);
        }

        return response()->json([
            'data' => (new CompositionRunResource($run))->resolve(),
        ], $run->wasRecentlyCreated ? 201 : 200);
    }

    public function searchComponents(ComponentSearchRequest $request): JsonResponse
    {
        $this->authorize('view', ProductComposition::class);

        $validated = $request->validated();
        $search = trim((string) ($validated['search'] ?? ''));
        $perPage = (int) ($validated['per_page'] ?? 20);

        $query = Product::query()
            ->where('track_inventory', true)
            // A formula is a recipe, not a stocked ingredient. Including it would
            // let a formula consume another formula's product record.
            ->excludingFormulaOnly()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%");
                });
            })
            ->when(
                isset($validated['exclude_product_id']),
                fn ($query) => $query->where('id', '!=', (int) $validated['exclude_product_id'])
            )
            ->orderBy('name');

        $products = $query->paginate($perPage);

        return response()->json([
            'data' => $products->getCollection()->map(function (Product $product) {
                $baseUnitId = $product->base_unit_id ?: 'piece';

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'barcode' => $product->barcode,
                    'base_unit_id' => $baseUnitId,
                    'base_unit_name' => $this->units->resolveDisplayUnit($baseUnitId),
                    'measurement_type' => $this->units->getMeasurementType($baseUnitId),
                    'stock_quantity' => (float) $product->stock_quantity,
                    'status' => $product->status,
                    'unit_options' => $this->unitOptionsFor($baseUnitId),
                ];
            })->values()->all(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function unitOptions(ComponentUnitRequest $request): JsonResponse
    {
        $this->authorize('view', ProductComposition::class);

        $product = Product::withArchived()
            ->withTrashed()
            ->findOrFail($request->validated('component_product_id'));

        $baseUnitId = $product->base_unit_id ?: 'piece';

        return response()->json([
            'data' => [
                'component_product_id' => $product->id,
                'base_unit_id' => $baseUnitId,
                'base_unit_name' => $this->units->resolveDisplayUnit($baseUnitId),
                'measurement_type' => $this->units->getMeasurementType($baseUnitId),
                'options' => $this->unitOptionsFor($baseUnitId),
            ],
        ]);
    }

    /**
     * @return array<int, array{id: string, label: string, factor: float, is_base: bool}>
     */
    private function unitOptionsFor(string $baseUnitId): array
    {
        return $this->units->getCompositionUnitOptions($baseUnitId);
    }

    private function respond(ProductComposition $composition, int $status = 200): JsonResponse
    {
        // sellingUnits powers the pricing guidance; load it with the composition
        // so a version list does not issue one query per row.
        $composition->loadMissing(['items.component', 'product.sellingUnits']);

        return response()->json([
            'data' => (new ProductCompositionResource(
                $composition,
                $this->costs->estimateComposition($composition),
            ))->resolve(),
        ], $status);
    }

    private function ensureBelongs(Product $product, ProductComposition $composition): void
    {
        abort_unless($composition->product_id === $product->id, 404);
    }
}
