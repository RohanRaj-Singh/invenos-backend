<?php

namespace App\Http\Controllers;

use App\Domains\Inventory\Services\InventoryService;
use App\Domains\Products\Services\ProductService;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
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
        if (! in_array($archived, ['active', 'archived', 'all'], true)) {
            $archived = 'active';
        }

        $composition = request('composition', 'all');
        if (! in_array($composition, ['all', 'formula', 'assembly'], true)) {
            $composition = 'all';
        }

        $perPage = (int) request('per_page', 25);
        if (! in_array($perPage, self::PAGE_SIZES, true)) {
            $perPage = 25;
        }

        $products = $this->inventoryService->search(
            query: $search,
            status: $status,
            categoryId: $categoryId,
            perPage: $perPage,
            archived: $archived,
            composition: $composition,
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
                'composition' => $composition,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * The dedicated movement page never existed as a component; the Stock Ledger
     * report is the working equivalent and carries the same data plus filters
     * and export. Redirect rather than render a missing page.
     */
    public function movements(): RedirectResponse
    {
        return redirect()->route('reports.stock.ledger', request()->only('product_id'));
    }

    /**
     * Low stock is owned by the reports module. Kept as a redirect so existing
     * links and bookmarks keep working instead of failing on a missing page.
     */
    public function lowStock(): RedirectResponse
    {
        return redirect()->route('reports.stock.low-stock');
    }

    public function adjust(): RedirectResponse
    {
        $this->authorize('inventory.adjust');

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

        // A formula is an ingredient template, not stocked goods: its own balance
        // never moves. Allowing an adjustment here would create phantom inventory
        // that no sale or purchase could ever reconcile.
        $product = Product::withArchived()->findOrFail((int) $data['product_id']);

        if ($product->isFormulaOnly()) {
            throw ValidationException::withMessages([
                'product_id' => "'{$product->name}' is a formula, so it holds no stock of its own. Adjust the ingredient products instead.",
            ]);
        }

        $this->inventoryService->recordTransaction(
            productId: (int) $data['product_id'],
            type: $data['type'],
            quantity: (float) $data['quantity'],
            notes: $data['notes'] ?? null,
        );

        return back()->with('success', 'Stock adjusted successfully.');
    }

    /** Stock valuation is presented by the Stock Report; keep the URL working. */
    public function valuation(): RedirectResponse
    {
        return redirect()->route('reports.stock');
    }
}
