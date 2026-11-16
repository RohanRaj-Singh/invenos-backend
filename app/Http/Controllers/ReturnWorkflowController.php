<?php

namespace App\Http\Controllers;

use App\Domains\Returns\DTOs\ReturnCreateData;
use App\Domains\Returns\Services\ReturnService;
use App\Models\ProductComposition;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
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
        $this->authorize('returns.create');

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
            // Explicit recovered material only. The server resolves the
            // component, unit, eligibility and cost from the run snapshot.
            'items.*.material_recoveries' => 'nullable|array',
            'items.*.material_recoveries.*.composition_run_item_id' => 'required|integer|min:1',
            'items.*.material_recoveries.*.quantity' => 'required|numeric|min:0.000001',
            'idempotency_key' => 'nullable|string|max:100',
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
        $return = $this->returns->get($id)->load([
            'componentRecoveries.component',
            'componentRecoveries.inventoryTransaction',
            'items',
        ]);

        $canViewCost = Gate::allows('cost', ProductComposition::class);
        $payload = $return->toArray();

        if (! $canViewCost) {
            // Recovery and ingredient cost are financial data; withhold them
            // rather than relying on the page not to render them.
            $payload = $this->withoutCostKeys($payload);
        }

        return Inertia::render(
            $return->type === 'SALE' ? 'returns/SaleReturnDetail' : 'returns/PurchaseReturnDetail',
            [
                'return' => $payload,
                'canProcess' => Gate::allows('returns.process'),
                'can_view_cost' => $canViewCost,
            ],
        );
    }

    /** Cost-bearing keys that must never reach a viewer without the cost permission. */
    private const COST_KEYS = [
        'cost_price', 'cost_complete', 'uncosted_quantity', 'uncosted_qty',
        'unit_cost', 'unit_cost_base', 'total_cost', 'line_cost',
        'average_cost', 'opening_cost', 'last_purchase_cost', 'default_purchase_cost',
        'cost_basis', 'estimated_cost', 'estimated_unit_cost',
    ];

    /**
     * Recursively remove cost keys. Removing them entirely (rather than nulling)
     * keeps "no cost recorded" indistinguishable from "cost hidden".
     *
     * @param  array<string, mixed>  $value
     * @return array<string, mixed>
     */
    private function withoutCostKeys(array $value): array
    {
        foreach ($value as $key => $item) {
            if (in_array($key, self::COST_KEYS, true)) {
                unset($value[$key]);

                continue;
            }

            if (is_array($item)) {
                $value[$key] = $this->withoutCostKeys($item);
            }
        }

        return $value;
    }

    public function complete(int $id): RedirectResponse
    {
        $this->authorize('returns.process');

        $this->returns->completeReturn($id);

        return back()->with('success', 'Return completed. Stock, balance and cash updated.');
    }

    public function cancel(int $id): RedirectResponse
    {
        $this->authorize('returns.process');

        $this->returns->cancelReturn($id);

        return back()->with('success', 'Return cancelled.');
    }

    public function reverse(int $id): RedirectResponse
    {
        $this->authorize('returns.process');

        $this->returns->reverseReturn($id, auth()->user()?->name);

        return back()->with('success', 'Return reversed. Compensating entries recorded.');
    }
}
