<?php

namespace App\Http\Controllers;

use App\Domains\Inventory\Services\InventoryService;
use App\Domains\Products\Services\ProductService;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    /** Allowlisted page sizes — prevents unbounded per_page values. */
    private const PAGE_SIZES = [10, 25, 50, 100, 250];

    public function __construct(
        private readonly InventoryService $inventoryService,
        private readonly ProductService $productService,
    ) {}

    public function index(): Response
    {
        $search = request('search', '');
        $status = request('status', '');
        $categoryId = request('category_id') ? (int) request('category_id') : null;

        $archived = request('archived', 'active');
        if (!in_array($archived, ['active', 'archived', 'all'], true)) {
            $archived = 'active';
        }

        $perPage = (int) request('per_page', 25);
        if (!in_array($perPage, self::PAGE_SIZES, true)) {
            $perPage = 25;
        }

        $products = $this->inventoryService->search(
            query: $search,
            status: $status,
            categoryId: $categoryId,
            perPage: $perPage,
            archived: $archived,
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
            'filters' => [
                'search' => $search,
                'status' => $status,
                'category_id' => $categoryId,
                'archived' => $archived,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function overview(): Response
    {
        $overview = $this->inventoryService->getOverview();

        return Inertia::render('inventory/Overview', [
            'overview' => $overview,
        ]);
    }

    public function movements(): Response
    {
        $productId = request('product_id') ? (int) request('product_id') : null;

        $movements = $this->inventoryService->getMovements(
            productId: $productId,
            perPage: 50,
        );

        return Inertia::render('inventory/Movements', [
            'movements' => $movements->items(),
            'meta' => [
                'current_page' => $movements->currentPage(),
                'last_page' => $movements->lastPage(),
                'per_page' => $movements->perPage(),
                'total' => $movements->total(),
            ],
        ]);
    }

    public function lowStock(): Response
    {
        $items = $this->inventoryService->getLowStock();

        return Inertia::render('inventory/LowStock', [
            'items' => $items,
        ]);
    }

    public function adjust(): \Illuminate\Http\RedirectResponse
    {
        $data = request()->validate([
            // Archived products are hidden from every picker, so reject them here too
            // rather than trusting the client not to post one.
            'product_id' => [
                'required', 'integer',
                Rule::exists('products', 'id')->whereNull('archived_at'),
            ],
            'type' => 'required|string|in:adjustment,damage,consumption',
            'quantity' => 'required|numeric',
            'notes' => 'nullable|string|max:500',
        ], [
            'product_id.exists' => 'That product is archived, so its stock cannot be adjusted.',
        ]);

        $this->inventoryService->recordTransaction(
            productId: (int) $data['product_id'],
            type: $data['type'],
            quantity: (float) $data['quantity'],
            notes: $data['notes'] ?? null,
        );

        return back()->with('success', 'Stock adjusted successfully.');
    }

    public function valuation(): Response
    {
        $valuation = $this->inventoryService->getValuation();

        return Inertia::render('inventory/Valuation', [
            'valuation' => $valuation,
        ]);
    }
}
