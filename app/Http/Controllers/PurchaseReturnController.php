<?php

namespace App\Http\Controllers;

use App\Domains\Returns\Services\ReturnService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseReturnController extends Controller
{
    public function __construct(
        private readonly ReturnService $returnService,
    ) {}

    public function index(): Response
    {
        $search = request('search', '');
        $returns = $this->returnService->search(query: $search, type: 'PURCHASE');

        return Inertia::render('returns/ReturnList', [
            'returns' => $returns->items(),
            'meta' => [
                'current_page' => $returns->currentPage(),
                'last_page' => $returns->lastPage(),
                'per_page' => $returns->perPage(),
                'total' => $returns->total(),
            ],
            'source' => 'purchase',
        ]);
    }

    public function show(int $id): Response
    {
        $return = $this->returnService->get($id);
        return Inertia::render('returns/PurchaseReturnDetail', ['return' => $return]);
    }
}
