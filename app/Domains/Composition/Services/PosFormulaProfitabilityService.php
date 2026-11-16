<?php

namespace App\Domains\Composition\Services;

use App\Domains\Composition\DTOs\CompositionItemOverrideData;
use App\Domains\Composition\DTOs\ExecuteCompositionData;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\SellingUnit;

/**
 * Informational profitability for a POS formula line, using the cashier's
 * runtime ingredient quantities.
 *
 * Read-only by construction: it never locks, writes, reserves or deducts. The
 * costing and expansion come from the execution service, and the scaling comes
 * from the same helper checkout uses, so a preview cannot drift from the sale.
 */
class PosFormulaProfitabilityService
{
    public function __construct(
        private readonly CompositionExecutionService $executions,
        private readonly CompositionQuantityMath $quantities,
        private readonly CompositionPricingService $pricing,
    ) {}

    /**
     * @param  CompositionItemOverrideData[]  $overrides  Per formula unit, in the override's unit.
     * @param  int[]  $optionalItemIds
     * @return array<string, mixed>
     */
    public function preview(
        Product $product,
        ProductComposition $composition,
        float $quantity,
        ?int $sellingUnitId,
        ?float $unitPrice,
        float $discountPercent,
        ?float $discountAmount,
        array $overrides,
        array $optionalItemIds,
    ): array {
        $sellingUnit = $this->resolveSellingUnit($product, $sellingUnitId);
        $sellingPrice = $unitPrice
            ?? ($sellingUnit?->sale_price !== null ? (float) $sellingUnit->sale_price : null);

        // Mirrors checkout: base quantity = commercial quantity x selling-unit factor.
        $sellingFactor = $sellingUnit === null ? 1.0 : (float) $sellingUnit->quantity;
        $sellingFactor = $sellingFactor > 0 ? $sellingFactor : 1.0;
        $baseQuantity = $quantity * $sellingFactor;

        $formulaUnits = $this->quantities->formulaUnits($composition, $product, $baseQuantity);
        $absoluteOverrides = $this->quantities->absoluteOverrides($overrides, $formulaUnits);

        $execution = $this->executions->previewRequirements(new ExecuteCompositionData(
            compositionId: $composition->id,
            quantity: $baseQuantity,
            quantityUnitId: $product->base_unit_id ?: 'piece',
            optionalItemIds: $optionalItemIds,
            overrides: $absoluteOverrides,
        ));

        $totalCost = $execution['total_cost'];
        $costComplete = (bool) $execution['complete'];

        $costPerFormulaUnit = ($totalCost === null || $formulaUnits <= 0)
            ? null
            : round($totalCost / $formulaUnits, 6);

        $grossSubtotal = $sellingPrice === null ? null : round($sellingPrice * $quantity, 2);
        $discount = $this->resolveDiscount($grossSubtotal, $discountPercent, $discountAmount);
        $netRevenue = ($grossSubtotal === null || $discount === null)
            ? null
            : max(0.0, round($grossSubtotal - $discount, 2));

        // Profit needs both sides. An incomplete cost must not masquerade as zero.
        $grossProfit = ($netRevenue === null || $totalCost === null)
            ? null
            : round($netRevenue - $totalCost, 2);

        $grossMargin = ($grossProfit === null || $netRevenue === null || $netRevenue <= 0)
            ? null
            : round(($grossProfit / $netRevenue) * 100, 2);

        $recommendation = $this->pricing->recommendedPriceFor($costPerFormulaUnit, $costComplete);

        $recommendedPrice = $recommendation['recommended_price'];

        return [
            'quantity' => $quantity,
            'formula_units' => $formulaUnits,
            'cost_complete' => $costComplete,
            'cost_basis' => $execution['cost_basis'],
            'cost_per_formula_unit' => $costPerFormulaUnit,
            'total_ingredient_cost' => $totalCost,
            'selling_unit_price' => $sellingPrice,
            'gross_subtotal' => $grossSubtotal,
            'discount_amount' => $discount,
            'net_revenue' => $netRevenue,
            'gross_profit' => $grossProfit,
            'gross_margin_percent' => $grossMargin,
            'target_margin_percent' => $recommendation['target_margin_percent'],
            'recommended_price' => $recommendedPrice,
            'recommended_profit' => ($recommendedPrice === null || $costPerFormulaUnit === null)
                ? null
                : round($recommendedPrice - $costPerFormulaUnit, 2),
            'available' => $recommendedPrice !== null,
            'unavailable_reason' => $recommendation['unavailable_reason'],
            'lines' => $execution['lines'],
        ];
    }

    private function resolveSellingUnit(Product $product, ?int $sellingUnitId): ?SellingUnit
    {
        $units = $product->relationLoaded('sellingUnits')
            ? $product->sellingUnits
            : $product->sellingUnits()->get();

        if ($sellingUnitId !== null) {
            $matched = $units->firstWhere('id', $sellingUnitId);

            if ($matched !== null) {
                return $matched;
            }
        }

        return $units->firstWhere('is_default', true) ?? $units->first();
    }

    private function resolveDiscount(?float $grossSubtotal, float $percent, ?float $amount): ?float
    {
        if ($grossSubtotal === null) {
            return null;
        }

        $value = $amount !== null
            ? $amount
            : round($grossSubtotal * min(max($percent, 0), 100) / 100, 2);

        return max(0.0, min(round($value, 2), $grossSubtotal));
    }
}
