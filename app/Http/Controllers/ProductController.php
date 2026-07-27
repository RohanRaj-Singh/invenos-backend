<?php

namespace App\Http\Controllers;

use App\Domains\Products\DTOs\CreateProductData;
use App\Domains\Products\Services\ProductService;
use App\Http\Requests\Products\CreateProductRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $productService,
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
        return Inertia::render('inventory/ProductForm', [
            'categories' => $this->productService->allCategories(),
            'generated_sku' => $this->productService->generateSku(''),
        ]);
    }

    public function store(CreateProductRequest $request): RedirectResponse
    {
        $data = CreateProductData::fromRequest($request->validated());
        $product = $this->productService->create($data);

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

        return Inertia::render('inventory/ProductDetails', [
            'product' => $product->toArray(),
            'movements' => $movements,
        ]);
    }

    public function edit(int $id): Response
    {
        $product = $this->productService->get($id);

        return Inertia::render('inventory/ProductForm', [
            'product' => $product->toArray(),
            'categories' => $this->productService->allCategories(),
        ]);
    }

    public function update(CreateProductRequest $request, int $id): RedirectResponse
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
}
