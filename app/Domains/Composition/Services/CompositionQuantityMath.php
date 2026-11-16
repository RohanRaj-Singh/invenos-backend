<?php

namespace App\Domains\Composition\Services;

use App\Domains\Composition\DTOs\CompositionItemOverrideData;
use App\Domains\Products\Services\ProductUnitService;
use App\Models\Product;
use App\Models\ProductComposition;
use Illuminate\Validation\ValidationException;

/**
 * The single place that converts a commercial formula quantity into execution
 * quantities.
 *
 * Checkout and the profitability preview both use it, so a preview can never
 * scale consumption differently from the sale it is describing.
 */
class CompositionQuantityMath
{
    public function __construct(
        private readonly ProductUnitService $units,
    ) {}

    /**
     * How many formula units a base quantity represents.
     *
     * A formula yielding 1 g sold as `quantity: 2` is 2 formula units; a formula
     * yielding 250 g sold as `quantity: 2` is 2 formula units of 250 g each.
     */
    public function formulaUnits(
        ProductComposition $composition,
        Product $product,
        float $baseQuantity,
    ): float {
        $baseUnit = $product->base_unit_id ?: 'piece';
        $outputUnit = $composition->output_unit_id ?: $baseUnit;

        $outputBase = $this->units->convert(
            (float) $composition->output_quantity,
            $outputUnit,
            $baseUnit,
        );

        if ($outputBase === null || $outputBase <= 0) {
            throw ValidationException::withMessages([
                'items' => "The formula output unit for '{$product->name}' is not compatible with the product base unit.",
            ]);
        }

        return round($baseQuantity / $outputBase, 6);
    }

    /**
     * Convert formula-editor quantities (per formula unit) into the absolute
     * quantities the execution engine expects.
     *
     * The engine does not scale overrides itself, so this multiply must happen
     * exactly once.
     *
     * @param  CompositionItemOverrideData[]  $overrides
     * @return CompositionItemOverrideData[]
     */
    public function absoluteOverrides(array $overrides, float $formulaUnits): array
    {
        if ($formulaUnits <= 0) {
            throw ValidationException::withMessages([
                'items' => 'The formula quantity must be greater than zero.',
            ]);
        }

        return array_map(fn (CompositionItemOverrideData $override) => new CompositionItemOverrideData(
            $override->compositionItemId,
            round($override->quantity * $formulaUnits, 6),
            $override->unitId,
        ), $overrides);
    }
}
