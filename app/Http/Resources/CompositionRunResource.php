<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompositionRunResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'run_number' => $this->run_number,
            'composition_id' => $this->composition_id,
            'product_id' => $this->product_id,
            'kind' => $this->kind,
            'output_unit_id' => $this->output_unit_id,
            'source_type' => $this->source_type,
            'source_id' => $this->source_id,
            'sale_item_id' => $this->sale_item_id,
            'reference' => $this->reference,
            'template_version' => $this->template_version,
            'template_snapshot' => $this->template_snapshot,
            'quantity' => (float) $this->quantity,
            'output_quantity' => $this->output_quantity === null ? null : (float) $this->output_quantity,
            'total_cost' => $this->total_cost === null ? null : (float) $this->total_cost,
            'unit_cost' => $this->unit_cost === null ? null : (float) $this->unit_cost,
            'cost_basis' => $this->cost_basis,
            'status' => $this->status,
            'location' => $this->location,
            'created_by' => $this->created_by,
            'effects_applied_at' => $this->effects_applied_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'items' => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'component_product_id' => $item->component_product_id,
                'component_name' => $item->component_name,
                'component_sku' => $item->component_sku,
                'unit' => $item->unit,
                'display_unit_id' => $item->display_unit_id,
                'display_quantity' => $item->display_quantity === null ? null : (float) $item->display_quantity,
                'template_quantity' => (float) $item->template_quantity,
                'actual_quantity' => (float) $item->actual_quantity,
                'wastage_pct' => (float) $item->wastage_pct,
                'is_optional' => (bool) $item->is_optional,
                'unit_cost' => $item->unit_cost === null ? null : (float) $item->unit_cost,
                'total_cost' => $item->total_cost === null ? null : (float) $item->total_cost,
                'cost_basis' => $item->cost_basis,
                'source_breakdown' => $item->source_breakdown,
                'inventory_transaction_id' => $item->inventory_transaction_id,
            ])->values()->all(),
        ];
    }
}
