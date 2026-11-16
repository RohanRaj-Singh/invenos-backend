<?php

namespace App\Domains\Composition\Services;

use App\Domains\Settings\Services\SettingService;
use App\Models\ProductComposition;
use App\Models\SellingUnit;

/**
 * Turns an existing composition cost estimate into pricing guidance.
 *
 * This is deliberately a thin layer over CompositionCostCalculator: it never
 * re-computes ingredient costs, it only relates an existing cost to a selling
 * price. Everything here is a gross margin, never a markup.
 *
 *   margin    = (price - cost) / price
 *   price     = cost / (1 - margin)
 */
class CompositionPricingService
{
    public const DEFAULT_TARGET_MARGIN = 30.0;

    /** Guard against a margin that would divide by zero. */
    private const MAX_MARGIN = 99.9999;

    public function __construct(
        private readonly CompositionCostCalculator $costs,
    ) {}

    /** Configured target gross margin, clamped to the valid range. */
    public function targetMarginPercent(): float
    {
        $value = app(SettingService::class)->get()['composition']['target_margin_percent']
            ?? self::DEFAULT_TARGET_MARGIN;

        return $this->clampMargin((float) $value);
    }

    /**
     * @param  array<string, mixed>|null  $cost  Output of CompositionCostCalculator::estimate*().
     * @return array<string, mixed>
     */
    public function summarize(ProductComposition $composition, ?array $cost = null): array
    {
        $cost ??= $this->costs->estimateComposition($composition);

        return $this->summarizeFromCost($cost, $this->defaultSellingUnit($composition));
    }

    /**
     * Same arithmetic, for callers that already know the selling unit (e.g. the
     * builder's cost preview, where no composition row exists yet).
     *
     * @param  array<string, mixed>  $cost
     * @return array<string, mixed>
     */
    public function summarizeFromCost(array $cost, ?SellingUnit $sellingUnit): array
    {
        $target = $this->targetMarginPercent();
        $sellingPrice = $sellingUnit?->sale_price !== null ? (float) $sellingUnit->sale_price : null;

        // Cost of ONE selling unit. The calculator's unit_cost is per base unit,
        // and a selling unit covers `quantity` base units.
        $unitCost = $cost['unit_cost'] ?? null;
        $costComplete = (bool) ($cost['complete'] ?? false);

        $costPerSellingUnit = ($unitCost === null)
            ? null
            : round((float) $unitCost * $this->sellingQuantity($sellingUnit), 6);

        // Zero is a real cost, not a missing one, so it must not be treated as
        // "unavailable" — but it also must not yield a bogus margin.
        $profit = ($costPerSellingUnit === null || $sellingPrice === null)
            ? null
            : round($sellingPrice - $costPerSellingUnit, 6);

        $margin = ($profit === null || $sellingPrice === null || $sellingPrice <= 0)
            ? null
            : round(($profit / $sellingPrice) * 100, 2);

        [$recommended, $unavailableReason] = $this->recommend($costPerSellingUnit, $costComplete, $target);

        $recommendedProfit = ($recommended === null || $costPerSellingUnit === null)
            ? null
            : round($recommended - $costPerSellingUnit, 2);

        return [
            'target_margin_percent' => $target,
            'estimated_cost' => $costPerSellingUnit,
            'cost_complete' => $costComplete,
            'cost_basis' => $cost['cost_basis'] ?? 'unavailable',
            'selling_price' => $sellingPrice,
            // Which unit the price refers to ("Rs. 500 per Formula").
            'selling_unit_name' => $sellingUnit?->name,
            'profit' => $profit,
            'margin_percent' => $margin,
            'recommended_price' => $recommended,
            'recommended_profit' => $recommendedProfit,
            'available' => $recommended !== null,
            'unavailable_reason' => $unavailableReason,
        ];
    }

    /**
     * @return array{0: float|null, 1: string|null}
     */
    private function recommend(?float $costPerSellingUnit, bool $costComplete, float $target): array
    {
        if (! $costComplete || $costPerSellingUnit === null) {
            return [null, 'incomplete_cost'];
        }

        if ($target >= 100) {
            return [null, 'invalid_target_margin'];
        }

        $denominator = 1 - ($target / 100);

        if ($denominator <= 0) {
            return [null, 'invalid_target_margin'];
        }

        $recommended = $costPerSellingUnit / $denominator;

        if (! is_finite($recommended) || $recommended < 0) {
            return [null, 'invalid_target_margin'];
        }

        // Round to the currency's minor unit, matching how prices are stored.
        return [round($recommended, 2), null];
    }

    /**
     * Recommended selling price for an arbitrary per-unit cost.
     *
     * Used by the POS profitability preview so it shares this service's margin
     * maths instead of re-deriving it.
     *
     * @return array{target_margin_percent: float, recommended_price: float|null, unavailable_reason: string|null}
     */
    public function recommendedPriceFor(?float $costPerSellingUnit, bool $costComplete): array
    {
        $target = $this->targetMarginPercent();
        [$price, $reason] = $this->recommend($costPerSellingUnit, $costComplete, $target);

        return [
            'target_margin_percent' => $target,
            'recommended_price' => $price,
            'unavailable_reason' => $reason,
        ];
    }

    private function clampMargin(float $value): float
    {
        if (! is_finite($value) || $value < 0) {
            return 0.0;
        }

        return min($value, self::MAX_MARGIN);
    }

    private function sellingQuantity(?SellingUnit $sellingUnit): float
    {
        $quantity = (float) ($sellingUnit?->quantity ?? 1);

        return $quantity > 0 ? $quantity : 1.0;
    }

    private function defaultSellingUnit(ProductComposition $composition): ?SellingUnit
    {
        $product = $composition->product;

        if ($product === null) {
            return null;
        }

        $units = $product->relationLoaded('sellingUnits')
            ? $product->sellingUnits
            : $product->sellingUnits()->get();

        return $units->firstWhere('is_default', true) ?? $units->first();
    }
}
