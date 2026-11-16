<?php

namespace App\Domains\Composition\Services;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Inventory\Services\CostResolver;
use App\Domains\Products\Services\ProductUnitService;
use App\Models\Product;
use App\Models\ProductComposition;
use Illuminate\Validation\ValidationException;

class CompositionCostCalculator
{
    public function __construct(
        private readonly ProductUnitService $units,
        private readonly CostResolver $costs,
    ) {}

    public function estimate(SaveCompositionData $data): array
    {
        return $this->estimateItems(
            $data->productId,
            $data->items,
            $data->outputQuantity,
            $data->outputUnitId,
            [$data->productId],
        );
    }

    public function estimateComposition(ProductComposition $composition): array
    {
        $composition->loadMissing('items.component');

        return $this->estimateItems(
            $composition->product_id,
            $this->itemsFromComposition($composition),
            (float) $composition->output_quantity,
            $composition->output_unit_id,
            [$composition->product_id],
        );
    }

    /**
     * Cost a draft that has no saved product yet (the create screen). The base
     * unit comes from the form instead of a product row, so the same line maths
     * and nested-composition handling apply as for a persisted formula.
     *
     * @param  CompositionItemData[]  $items
     */
    public function estimateDraft(array $items, float $outputQuantity, ?string $outputUnitId, string $baseUnitId): array
    {
        return $this->estimateItemsForBaseUnit($baseUnitId, $items, $outputQuantity, $outputUnitId, []);
    }

    /**
     * @param  CompositionItemData[]  $items
     * @param  int[]  $visited
     */
    private function estimateItems(int $productId, array $items, float $outputQuantity, ?string $outputUnitId, array $visited): array
    {
        $product = Product::withArchived()->withTrashed()->find($productId);

        if ($product === null) {
            throw ValidationException::withMessages(['product_id' => 'The composition product does not exist.']);
        }

        return $this->estimateItemsForBaseUnit(
            $product->base_unit_id ?: 'piece',
            $items,
            $outputQuantity,
            $outputUnitId,
            $visited,
        );
    }

    /**
     * @param  CompositionItemData[]  $items
     * @param  int[]  $visited
     */
    private function estimateItemsForBaseUnit(string $formulaBaseUnitId, array $items, float $outputQuantity, ?string $outputUnitId, array $visited): array
    {
        $outputBaseQuantity = $this->units->convert(
            $outputQuantity,
            $outputUnitId ?: $formulaBaseUnitId,
            $formulaBaseUnitId,
        );

        if ($outputBaseQuantity === null || $outputBaseQuantity <= 0) {
            throw ValidationException::withMessages([
                'output_unit_id' => 'The output unit is not compatible with the product base unit.',
            ]);
        }

        $lineResults = [];
        $lineCosts = [];
        $basisRank = ['exact' => 0, 'estimated' => 1, 'unavailable' => 2];

        foreach ($items as $index => $item) {
            $component = Product::withArchived()->withTrashed()->find($item->componentProductId);

            if ($component === null) {
                throw ValidationException::withMessages([
                    "items.{$index}.component_product_id" => 'The component product does not exist.',
                ]);
            }

            $baseUnitId = $component->base_unit_id ?: 'piece';
            $unitCost = $this->costs->unitCost($component);
            $basis = $this->costs->costBasis($component);
            $nested = false;
            $nestedCompositionId = null;
            $nestedVersion = null;

            if ($unitCost === null) {
                $nestedComposition = ProductComposition::query()
                    ->where('product_id', $component->id)
                    ->where('is_active', true)
                    ->with('items.component')
                    ->orderBy('kind')
                    ->first();

                if ($nestedComposition !== null) {
                    if (in_array($nestedComposition->product_id, $visited, true)) {
                        throw ValidationException::withMessages([
                            'items' => 'The composition would create a cost cycle.',
                        ]);
                    }

                    $nestedEstimate = $this->estimateItems(
                        $nestedComposition->product_id,
                        $this->itemsFromComposition($nestedComposition),
                        (float) $nestedComposition->output_quantity,
                        $nestedComposition->output_unit_id,
                        [...$visited, $nestedComposition->product_id],
                    );

                    $unitCost = $nestedEstimate['unit_cost'];
                    $basis = $nestedEstimate['cost_basis'];
                    $nested = true;
                    $nestedCompositionId = $nestedComposition->id;
                    $nestedVersion = $nestedComposition->version;
                }
            }

            $effectiveQuantity = (float) $item->quantityBase * (1 + ((float) $item->wastagePct / 100));
            $lineCost = $unitCost === null ? null : $effectiveQuantity * $unitCost;

            $lineResults[] = [
                'component_product_id' => $component->id,
                'component_name' => $component->name,
                'component_sku' => $component->sku,
                'base_unit_id' => $baseUnitId,
                'base_unit_name' => $this->units->resolveDisplayUnit($baseUnitId),
                'quantity_base' => (float) $item->quantityBase,
                'display_unit_id' => $item->displayUnitId,
                'display_unit_name' => $this->units->resolveDisplayUnit($item->displayUnitId ?? $baseUnitId),
                'wastage_pct' => (float) $item->wastagePct,
                'effective_quantity' => $effectiveQuantity,
                'unit_cost' => $unitCost,
                'line_cost' => $lineCost,
                'cost_basis' => $basis,
                'nested' => $nested,
                'nested_composition_id' => $nestedCompositionId,
                'nested_version' => $nestedVersion,
                'is_optional' => $item->isOptional,
                'sort_order' => $item->sortOrder ?? $index,
            ];

            if ($lineCost !== null) {
                $lineCosts[] = $lineCost;
            }
        }

        $totalCost = count($lineCosts) === count($lineResults)
            ? array_sum($lineCosts)
            : null;

        $costBasis = 'unavailable';
        if ($lineResults !== []) {
            $worst = 0;
            foreach ($lineResults as $line) {
                $worst = max($worst, $basisRank[$line['cost_basis']] ?? 2);
            }
            $costBasis = array_search($worst, $basisRank, true) ?: 'unavailable';
        }

        return [
            'output_quantity' => $outputQuantity,
            'output_unit_id' => $outputUnitId ?: $formulaBaseUnitId,
            'output_quantity_base' => $outputBaseQuantity,
            'total_cost' => $totalCost,
            'unit_cost' => $totalCost !== null ? $totalCost / $outputBaseQuantity : null,
            'cost_basis' => $costBasis,
            'complete' => $totalCost !== null,
            'is_estimated' => $costBasis === 'estimated',
            'items' => $lineResults,
        ];
    }

    /**
     * @return CompositionItemData[]
     */
    private function itemsFromComposition(ProductComposition $composition): array
    {
        return $composition->items->map(fn ($item) => new CompositionItemData(
            componentProductId: $item->component_product_id,
            quantityBase: (float) $item->quantity_base,
            displayUnitId: $item->display_unit_id,
            wastagePct: (float) $item->wastage_pct,
            isOptional: (bool) $item->is_optional,
            sortOrder: (int) $item->sort_order,
        ))->all();
    }
}
