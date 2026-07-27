<?php

namespace App\Http\Controllers;

use App\Domains\Sales\DTOs\CreateSaleReturnData;
use App\Domains\Sales\Services\SaleReturnService;
use App\Http\Requests\Sales\CreateSaleReturnRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SaleReturnController extends Controller
{
    public function __construct(
        private readonly SaleReturnService $returnService,
    ) {}

    public function index(): Response
    {
        $returns = $this->returnService->search(request('search', ''));
        return Inertia::render('returns/ReturnList', [
            'returns' => $returns->items(),
            'meta' => [
                'current_page' => $returns->currentPage(),
                'last_page' => $returns->lastPage(),
                'per_page' => $returns->perPage(),
                'total' => $returns->total(),
            ],
            'source' => 'sale',
        ]);
    }

    public function store(CreateSaleReturnRequest $request): RedirectResponse
    {
        $data = CreateSaleReturnData::fromRequest($request->validated());
        $return = $this->returnService->create($data);
        return redirect()->route('sales.returns.show', $return->id)
            ->with('success', 'Sale return processed successfully.');
    }

    public function show(int $id): Response
    {
        $return = $this->returnService->get($id);
        return Inertia::render('returns/SaleReturnDetail', ['return' => $return]);
    }
}
