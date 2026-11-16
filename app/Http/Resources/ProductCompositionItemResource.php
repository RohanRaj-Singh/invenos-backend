<?php

namespace App\Http\Resources;

use App\Domains\Inventory\Services\InventoryService;
use App\Domains\Products\Services\ProductUnitService;
use App\Models\ProductComposition;
use App\Models\ProductCompositionItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

class ProductCompositionItemResource extends JsonResource
{
    public function __construct(
        ProductCompositionItem $resource,
        private readonly ?array $cost = null,
    ) {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        $component = $this->component;
        $baseUnitId = $component?->base_unit_id ?: 'piece';
        $displayUnitId = $this->display_unit_id ?: $baseUnitId;
        $displayQuantity = app(ProductUnitService::class)->convert(
            (float) $this->quantity_base,
            $baseUnitId,
            $displayUnitId,
        );

        // Stock is held in the component's base unit. Express it in the same
        // unit the cashier edits so a shortfall comparison is apples to apples.
        $stockInDisplayUnit = $component === null
            ? null
            : app(ProductUnitService::class)->convert(
                (float) $component->stock_quantity,
                $baseUnitId,
                $displayUnitId,
            );

        $canViewCost = Gate::allows('cost', ProductComposition::class);

        return [
            'id' => $this->id,
            'component_product_id' => $this->component_product_id,
            'component' => $component ? [
                'id' => $component->id,
                'name' => $component->name,
                'sku' => $component->sku,
                'barcode' => $component->barcode,
                'base_unit_id' => $baseUnitId,
                'base_unit_name' => app(ProductUnitService::class)->resolveDisplayUnit($baseUnitId),
                'track_inventory' => (bool) $component->track_inventory,
                'stock_quantity' => (float) $component->stock_quantity,
                // Resolved policy so the POS can warn instead of guessing: an
                // ingredient follows the same negative-stock rule as a product.
                'allows_negative_stock' => app(InventoryService::class)->allowsNegativeStock($component),
                'status' => $component->status,
                'archived' => $component->archived_at !== null,
                'unit_options' => app(ProductUnitService::class)->getCompositionUnitOptions($baseUnitId),
            ] : null,
            'quantity_base' => (float) $this->quantity_base,
            'display_unit_id' => $displayUnitId,
            'display_unit_name' => app(ProductUnitService::class)->resolveDisplayUnit($displayUnitId),
            'display_quantity' => $displayQuantity ?? (float) $this->quantity_base,
            'display_stock_quantity' => $stockInDisplayUnit === null
                ? null
                : round($stockInDisplayUnit, 6),
            'wastage_pct' => (float) $this->wastage_pct,
            'effective_quantity' => $this->cost['effective_quantity']
                ?? ((float) $this->quantity_base * (1 + ((float) $this->wastage_pct / 100))),
            // Cost keys are withheld entirely — not nulled — so an unauthorised
            // client cannot distinguish "no cost" from "cost hidden".
            ...($canViewCost ? [
                'unit_cost' => $this->cost['unit_cost'] ?? null,
                'line_cost' => $this->cost['line_cost'] ?? null,
                'cost_basis' => $this->cost['cost_basis'] ?? 'unavailable',
            ] : []),
            'nested' => (bool) ($this->cost['nested'] ?? false),
            'nested_composition_id' => $this->cost['nested_composition_id'] ?? null,
            'nested_version' => $this->cost['nested_version'] ?? null,
            'is_optional' => (bool) $this->is_optional,
            'sort_order' => (int) $this->sort_order,
        ];
    }
}
