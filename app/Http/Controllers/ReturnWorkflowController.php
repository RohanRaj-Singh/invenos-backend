<?php

namespace App\Http\Controllers;

use App\Domains\Returns\DTOs\ReturnCreateData;
use App\Domains\Returns\Services\ReturnService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReturnWorkflowController extends Controller
{
    public function __construct(
        private readonly ReturnService $returns,
    ) {}

    public function storeSale(Request $request): RedirectResponse
    {
        return $this->store($request, 'SALE', 'sale');
    }

    public function storePurchase(Request $request): RedirectResponse
    {
        return $this->store($request, 'PURCHASE', 'purchase_bill');
    }

    private function store(Request $request, string $type, string $referenceType): RedirectResponse
    {
        $validated = $request->validate([
            'reference_id' => 'required|integer',
            'return_date' => 'nullable|date',
            'contact_id' => 'nullable|integer|exists:contacts,id',
            'contact_name' => 'nullable|string',
            'reason_id' => 'nullable|integer|exists:return_reasons,id',
            'reason_note' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.reference_item_id' => 'required|integer',
            'items.*.reference_item_type' => 'required|string',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.product_name' => 'nullable|string',
            'items.*.selling_unit_id' => 'nullable|integer',
            'items.*.packaging_name' => 'nullable|string',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.base_quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.total' => 'required|numeric|min:0',
            'items.*.restock' => 'nullable|boolean',
            'items.*.reason_id' => 'nullable|integer',
            'items.*.notes' => 'nullable|string',
            'subtotal' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'grand_total' => 'required|numeric|min:0',
            'refund_amount' => 'nullable|numeric|min:0',
            'refund_method' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $validated['type'] = $type;
        $validated['reference_type'] = $referenceType;
        $validated['created_by'] = auth()->user()?->name ?? 'System';

        $return = $this->returns->createReturn(ReturnCreateData::fromRequest($validated));

        return redirect()->route('returns.show', $return->id)
            ->with('success', 'Return created. Review it, then complete it to apply effects.');
    }

    public function show(int $id): Response
    {
        $return = $this->returns->get($id);

        return Inertia::render(
            $return->type === 'SALE' ? 'returns/SaleReturnDetail' : 'returns/PurchaseReturnDetail',
            ['return' => $return],
        );
    }

    public function complete(int $id): RedirectResponse
    {
        $this->returns->completeReturn($id);

        return back()->with('success', 'Return completed. Stock, balance and cash updated.');
    }

    public function cancel(int $id): RedirectResponse
    {
        $this->returns->cancelReturn($id);

        return back()->with('success', 'Return cancelled.');
    }

    public function reverse(int $id): RedirectResponse
    {
        $this->returns->reverseReturn($id, auth()->user()?->name);

        return back()->with('success', 'Return reversed. Compensating entries recorded.');
    }
}
