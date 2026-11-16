<?php

namespace App\Http\Resources;

use App\Domains\Composition\Services\CompositionPricingService;
use App\Domains\Products\Services\ProductUnitService;
use App\Models\ProductComposition;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

class ProductCompositionResource extends JsonResource
{
    public function __construct(
        ProductComposition $resource,
        private readonly ?array $cost = null,
    ) {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        $items = $this->items;
        $costItems = collect($this->cost['items'] ?? [])->keyBy('component_product_id');
        $outputUnitId = $this->output_unit_id ?: ($this->product?->base_unit_id ?: 'piece');
        $canViewCost = Gate::allows('cost', ProductComposition::class);

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product' => $this->product ? [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'sku' => $this->product->sku,
                'base_unit_id' => $this->product->base_unit_id,
                'base_unit_name' => app(ProductUnitService::class)->resolveDisplayUnit($this->product->base_unit_id),
            ] : null,
            'kind' => $this->kind,
            'version' => (int) $this->version,
            'name' => $this->name,
            'output_quantity' => (float) $this->output_quantity,
            'output_unit_id' => $outputUnitId,
            'output_unit_name' => app(ProductUnitService::class)->resolveDisplayUnit($outputUnitId),
            'is_active' => (bool) $this->is_active,
            'notes' => $this->notes,
            'created_by' => $this->created_by,
            'component_count' => $items->count(),
            'items' => $items->map(fn ($item) => (new ProductCompositionItemResource(
                $item,
                $costItems->get($item->component_product_id),
            ))->resolve())->values()->all(),
            // Cost keys are withheld entirely — not nulled — for users without
            // the cost permission. This includes derived metadata such as the
            // cost basis, which would otherwise hint at pricing data.
            ...($canViewCost ? [
                'estimated_cost' => $this->cost['total_cost'] ?? null,
                'estimated_unit_cost' => $this->cost['unit_cost'] ?? null,
                'cost_basis' => $this->cost['cost_basis'] ?? 'unavailable',
                'cost_complete' => (bool) ($this->cost['complete'] ?? false),
                'is_estimated' => (bool) ($this->cost['is_estimated'] ?? true),
                // Pricing guidance is cost-derived, so it shares the cost
                // permission rather than being exposed on its own.
                'pricing' => app(CompositionPricingService::class)
                    ->summarize($this->resource, $this->cost),
            ] : []),
            'output_quantity_base' => $this->cost['output_quantity_base'] ?? null,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
