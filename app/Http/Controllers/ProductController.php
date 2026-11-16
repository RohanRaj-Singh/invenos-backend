<?php

namespace App\Http\Controllers;

use App\Domains\Composition\Services\CompositionPayloadMapper;
use App\Domains\Composition\Services\CompositionService;
use App\Domains\Products\DTOs\CreateProductData;
use App\Domains\Products\Services\PackagingDerivationEngine;
use App\Domains\Products\Services\ProductService;
use App\Domains\Products\Services\ProductUnitService;
use App\Http\Requests\Products\CreateProductRequest;
use App\Http\Requests\Products\UpdateProductRequest;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\PurchaseBillItem;
use App\Models\SaleItem;
use App\Policies\Lifecycle\ProductPolicy;
use App\Services\Lifecycle\RecordLifecycleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $productService,
        private readonly PackagingDerivationEngine $derivationEngine,
        private readonly RecordLifecycleService $lifecycle,
        private readonly ProductUnitService $productUnitService,
        private readonly CompositionPayloadMapper $compositionMapper,
        private readonly CompositionService $compositions,
    ) {}

    public function index(): Response
    {
        $search = request('search', '');
        $categoryId = request('category_id') ? (int) request('category_id') : null;

        $products = $this->productService->search(
            query: $search,
            categoryId: $categoryId,
            perPage: 25,
        );

        return Inertia::render('inventory/ProductList', [
            'products' => $products->items(),
            'categories' => $this->productService->allCategories(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
            'filters' => ['search' => $search, 'category_id' => $categoryId],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('inventory/CreateProduct', [
            'categories' => $this->productService->allCategories(),
            'products' => $this->productService->search(perPage: 999)->items(),
            'generated_sku' => $this->productService->generateSku(''),
            'setup_formula' => request()->boolean('formula'),
            // Live formula costing is only shown (and only requested) by users
            // who may see cost.
            'can_view_cost' => Gate::allows('cost', ProductComposition::class),
        ]);
    }

    public function store(CreateProductRequest $request): RedirectResponse
    {
        $this->authorize('products.create');

        $validated = $request->validated();
        $compositionPayload = $validated['composition'] ?? null;
        unset($validated['composition']);

        if ($compositionPayload !== null) {
            // Creating a formula is composition management, not just product entry.
            $this->authorize('manage', ProductComposition::class);
        }

        $data = CreateProductData::fromRequest($validated);

        // Ensure unique barcode — append suffix if collision
        if ($data->barcode && Product::withTrashed()->where('barcode', $data->barcode)->exists()) {
            $base = $data->barcode;
            $n = 1;
            while (Product::withTrashed()->where('barcode', $base.'-'.$n)->exists()) {
                $n++;
            }
            $data = new CreateProductData(
                name: $data->name,
                sku: $data->sku,
                barcode: $base.'-'.$n,
                categoryId: $data->categoryId,
                description: $data->description,
                baseUnitId: $data->baseUnitId,
                trackInventory: $data->trackInventory,
                lowStockThreshold: $data->lowStockThreshold,
                stockQuantity: $data->stockQuantity,
                defaultPurchaseCost: $data->defaultPurchaseCost,
                supplierName: $data->supplierName,
                location: $data->location,
                createdBy: $data->createdBy,
                sellingUnits: $data->sellingUnits,
                purchaseConfig: $data->purchaseConfig,
                packaging: $data->packaging,
            );
        }

        // Ensure unique SKU — append suffix if collision
        if (Product::withTrashed()->where('sku', $data->sku)->exists()) {
            $base = $data->sku;
            $n = 1;
            while (Product::withTrashed()->where('sku', $base.'-'.$n)->exists()) {
                $n++;
            }
            $data = new CreateProductData(
                name: $data->name,
                sku: $base.'-'.$n,
                barcode: $data->barcode,
                categoryId: $data->categoryId,
                description: $data->description,
                baseUnitId: $data->baseUnitId,
                trackInventory: $data->trackInventory,
                lowStockThreshold: $data->lowStockThreshold,
                stockQuantity: $data->stockQuantity,
                defaultPurchaseCost: $data->defaultPurchaseCost,
                supplierName: $data->supplierName,
                location: $data->location,
                createdBy: $data->createdBy,
                sellingUnits: $data->sellingUnits,
                purchaseConfig: $data->purchaseConfig,
                packaging: $data->packaging,
            );
        }

        // Product and first formula version commit or roll back together, so a
        // rejected ingredient never leaves a half-created formula product behind.
        $product = DB::transaction(function () use ($data, $compositionPayload, $request) {
            $product = $this->productService->create($data);

            if ($compositionPayload !== null) {
                $payload = ['kind' => ProductComposition::KIND_CONSUMPTION, ...$compositionPayload];
                $saveData = $this->compositionMapper->toSaveData($payload, $product->id);
                $this->compositions->save($saveData, $request->user()?->name);
            }

            return $product;
        });

        if ($request->boolean('_stay')) {
            return redirect()->route('inventory.create')
                ->with('success', "{$product->name} saved ✓");
        }

        if ($compositionPayload !== null) {
            return redirect()->route('inventory.show', [
                'id' => $product->id,
                'tab' => 'composition',
            ])->with('success', 'Formula created.');
        }

        if ($request->boolean('_setup_formula')) {
            return redirect()->route('inventory.show', [
                'id' => $product->id,
                'tab' => 'composition',
            ])->with('success', 'Product created. Add its formula below.');
        }

        return redirect()->route('inventory.show', $product->id)
            ->with('success', 'Product created successfully.');
    }

    public function show(int $id): Response
    {
        $product = $this->productService->get($id);

        $movements = InventoryTransaction::with(['product' => fn ($q) => $q->withArchived()])
            ->where('product_id', $id)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get()
            ->toArray();

        $purchases = PurchaseBillItem::with('purchaseBill.supplier')
            ->where('product_id', $id)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get()
            ->toArray();

        $sales = SaleItem::with('sale.customer')
            ->where('product_id', $id)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get()
            ->toArray();

        $blocker = app(ProductPolicy::class)->deleteBlocker($product);

        return Inertia::render('inventory/ProductDetails', [
            'product' => $product->toArray(),
            'movements' => $movements,
            'purchases' => $purchases,
            'sales' => $sales,
            // Cost visibility is decided by the server, not inferred from role.
            'can_view_cost' => Gate::allows('cost', ProductComposition::class),
            'lifecycle' => [
                'can_delete' => $blocker === null,
                'delete_blocker' => $blocker,
                'can_archive' => ! $product->isArchived(),
                'can_unarchive' => $product->isArchived(),
            ],
        ]);
    }

    public function edit(int $id): Response
    {
        $product = $this->productService->get($id);

        return Inertia::render('inventory/EditProduct', [
            'product' => $product->toArray(),
            'categories' => $this->productService->allCategories(),
            'products' => $this->productService->search(perPage: 999)->items(),
        ]);
    }

    public function update(UpdateProductRequest $request, int $id): RedirectResponse
    {
        $this->authorize('products.edit');

        $product = $this->productService->update($id, $request->validated());

        return redirect()->route('inventory.show', $product->id)
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $this->authorize('lifecycle.delete-products');

        $product = Product::withArchived()->findOrFail($id);
        $reason = request('reason', 'No reason provided');

        try {
            $this->lifecycle->delete($product, $reason, auth()->user());

            return redirect()->route('inventory.index')
                ->with('success', "Product '{$product->name}' moved to the Recycle Bin.");
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function archive(int $id): RedirectResponse
    {
        $this->authorize('lifecycle.archive-products');

        $product = Product::withArchived()->findOrFail($id);
        $reason = request('reason', 'No reason provided');

        try {
            $this->lifecycle->archive($product, $reason, auth()->user());

            return redirect()->route('inventory.show', $product->id)
                ->with('success', "Product '{$product->name}' archived.");
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function unarchive(int $id): RedirectResponse
    {
        $this->authorize('lifecycle.archive-products');

        $product = Product::withArchived()->findOrFail($id);
        $reason = request('reason', 'No reason provided');

        try {
            $this->lifecycle->unarchive($product, $reason, auth()->user());

            return redirect()->route('inventory.show', $product->id)
                ->with('success', "Product '{$product->name}' is active again.");
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function generateSku(): JsonResponse
    {
        $name = request('name', '');
        $sku = $this->productService->generateSku($name);

        return response()->json(['sku' => $sku]);
    }

    /**
     * Preview derived selling units from packaging levels without persisting.
     * Used by the frontend packaging builder to show real-time preview.
     */
    public function previewPackaging(): JsonResponse
    {
        $data = request()->validate([
            'packaging' => 'required|array',
            'packaging.*.container_unit_id' => 'required|integer|exists:product_units,id',
            'packaging.*.contains_unit_id' => 'required|integer|exists:product_units,id',
            'packaging.*.quantity' => 'required|numeric|min:0.01',
            'packaging.*.level' => 'required|integer|min:1',
        ]);

        $preview = $this->derivationEngine->preview($data['packaging']);

        return response()->json([
            'success' => true,
            'data' => $preview->values(),
        ]);
    }

    /**
     * List all product units (for autocomplete).
     */
    public function productUnits(): JsonResponse
    {
        $options = $this->productUnitService->getUnitOptions();

        return response()->json([
            'success' => true,
            'data' => $options,
        ]);
    }

    /**
     * Get custom measurement options for a base unit.
     * This is the server-authoritative source — frontend never computes this.
     */
    public function measurementOptions(): JsonResponse
    {
        $baseUnitId = request('base_unit_id', 'piece');
        $options = $this->productUnitService->getMeasurementOptions($baseUnitId);

        return response()->json([
            'success' => true,
            'data' => $options,
        ]);
    }
}
