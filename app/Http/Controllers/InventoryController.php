<?php

namespace App\Http\Controllers;

use App\Domains\Inventory\Services\InventoryService;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventoryService,
    ) {}

    public function index(): Response
    {
        $search = request('search', '');
        $status = request('status', '');
        $categoryId = request('category_id') ? (int) request('category_id') : null;

        $products = $this->inventoryService->search(
            query: $search,
            status: $status,
            categoryId: $categoryId,
            perPage: 25,
        );

        return Inertia::render('inventory/ProductList', [
            'products' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
            'filters' => ['search' => $search, 'status' => $status, 'category_id' => $categoryId],
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
            'product_id' => 'required|integer|exists:products,id',
            'type' => 'required|string|in:adjustment,damage,consumption',
            'quantity' => 'required|numeric',
            'notes' => 'nullable|string|max:500',
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
