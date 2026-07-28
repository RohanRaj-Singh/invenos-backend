<?php

namespace App\Http\Controllers;

use App\Domains\Products\DTOs\CreateProductData;
use App\Domains\Products\Services\PackagingDerivationEngine;
use App\Domains\Products\Services\ProductService;
use App\Http\Requests\Products\CreateProductRequest;
use App\Http\Requests\Products\UpdateProductRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $productService,
        private readonly PackagingDerivationEngine $derivationEngine,
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
        ]);
    }

    public function store(CreateProductRequest $request): RedirectResponse
    {
        $data = CreateProductData::fromRequest($request->validated());

        // Ensure unique barcode — append suffix if collision
        if ($data->barcode && \App\Models\Product::withTrashed()->where('barcode', $data->barcode)->exists()) {
            $base = $data->barcode;
            $n = 1;
            while (\App\Models\Product::withTrashed()->where('barcode', $base . '-' . $n)->exists()) {
                $n++;
            }
            $data = new \App\Domains\Products\DTOs\CreateProductData(
                name: $data->name,
                sku: $data->sku,
                barcode: $base . '-' . $n,
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
            );
        }

        // Ensure unique SKU — append suffix if collision
        if (\App\Models\Product::withTrashed()->where('sku', $data->sku)->exists()) {
            $base = $data->sku;
            $n = 1;
            while (\App\Models\Product::withTrashed()->where('sku', $base . '-' . $n)->exists()) {
                $n++;
            }
            $data = new \App\Domains\Products\DTOs\CreateProductData(
                name: $data->name,
                sku: $base . '-' . $n,
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
            );
        }

        $product = $this->productService->create($data);

        if ($request->boolean('_stay')) {
            return redirect()->route('inventory.create')
                ->with('success', "{$product->name} saved ✓");
        }

        return redirect()->route('inventory.show', $product->id)
            ->with('success', 'Product created successfully.');
    }

    public function show(int $id): Response
    {
        $product = $this->productService->get($id);

        $movements = \App\Models\InventoryTransaction::with('product')
            ->where('product_id', $id)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get()
            ->toArray();

        $purchases = \App\Models\PurchaseBillItem::with('purchaseBill.supplier')
            ->where('product_id', $id)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get()
            ->toArray();

        $sales = \App\Models\SaleItem::with('sale.customer')
            ->where('product_id', $id)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get()
            ->toArray();

        return Inertia::render('inventory/ProductDetails', [
            'product' => $product->toArray(),
            'movements' => $movements,
            'purchases' => $purchases,
            'sales' => $sales,
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
        $product = $this->productService->update($id, $request->validated());

        return redirect()->route('inventory.show', $product->id)
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $this->productService->delete($id);

        return redirect()->route('inventory.index')
            ->with('success', 'Product deleted successfully.');
    }

    public function generateSku(): \Illuminate\Http\JsonResponse
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
        $search = request('search', '');
        $query = \App\Models\ProductUnit::query();

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $units = $query->orderBy('name')->take(20)->get();

        return response()->json([
            'success' => true,
            'data' => $units,
        ]);
    }
}
