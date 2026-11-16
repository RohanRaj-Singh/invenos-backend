<?php

namespace App\Domains\Reports\Services;

use Illuminate\Support\Facades\DB;

/**
 * Canonical sale COGS calculator.
 *
 * Simple/assembly lines keep the existing `base_quantity * cost_price` rule.
 * Consumption lines use the immutable `composition_run_items` snapshots linked
 * to the sale item. Unknown component costs are preserved as an incomplete
 * known-cost subtotal, never silently treated as a complete zero cost.
 */
class CogsCalculator
{
    public function net(string $from, string $to): float
    {
        return round($this->summary($from, $to)['cogs'] - $this->returned($from, $to), 6);
    }

    public function gross(string $from, string $to): float
    {
        return $this->summary($from, $to)['cogs'];
    }

    /**
     * @return array{
     *     cogs: float,
     *     simple_cogs: float,
     *     composition_cogs: float,
     *     cost_complete: bool,
     *     simple_cost_complete: bool,
     *     uncosted_simple_items: int,
     *     uncosted_simple_lines: int,
     *     uncosted_composition_items: int,
     *     uncosted_composition_lines: int,
     *     composition_cost_basis: string,
     *     composition_item_count: int
     * }
     */
    public function summary(string $from, string $to): array
    {
        $items = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->whereNull('sales.deleted_at')
            ->whereBetween('sales.date', [$from, $to])
            ->select(
                'sale_items.id',
                'sale_items.base_quantity',
                'sale_items.cost_price',
                'sale_items.cost_complete',
                'sale_items.uncosted_quantity',
            )
            ->get();

        $lineCosts = $this->lineCostsForSaleItemIds($items->pluck('id')->all());

        $cogs = 0.0;
        $simpleCogs = 0.0;
        $compositionCogs = 0.0;
        $uncostedItems = 0;
        $uncostedLines = 0;
        $uncostedSimpleItems = 0;
        $uncostedSimpleLines = 0;
        $estimated = false;
        $compositionItems = 0;

        foreach ($items as $item) {
            $line = $lineCosts[(int) $item->id] ?? null;

            if ($line === null) {
                continue;
            }

            $cogs += $line['total_cost'];

            if (! $line['is_composition']) {
                $simpleCogs += $line['total_cost'];

                if (! $line['cost_complete']) {
                    $uncostedSimpleItems++;
                    $uncostedSimpleLines += max(1, $line['uncosted_lines']);
                }

                continue;
            }

            $compositionItems++;
            $compositionCogs += $line['total_cost'];

            if (! $line['cost_complete']) {
                $uncostedItems++;
                $uncostedLines += max(1, $line['uncosted_lines']);
            } elseif ($line['cost_basis'] === 'estimated') {
                $estimated = true;
            }
        }

        return [
            'cogs' => round($cogs, 6),
            'simple_cogs' => round($simpleCogs, 6),
            'composition_cogs' => round($compositionCogs, 6),
            'cost_complete' => $uncostedItems === 0 && $uncostedSimpleItems === 0,
            'simple_cost_complete' => $uncostedSimpleItems === 0,
            'uncosted_simple_items' => $uncostedSimpleItems,
            'uncosted_simple_lines' => $uncostedSimpleLines,
            'uncosted_composition_items' => $uncostedItems,
            'uncosted_composition_lines' => $uncostedLines,
            'composition_cost_basis' => $compositionItems === 0
                ? 'none'
                : ($uncostedItems > 0
                    ? ($compositionCogs > 0 ? 'partial' : 'unavailable')
                    : ($estimated ? 'estimated' : 'exact')),
            'composition_item_count' => $compositionItems,
        ];
    }

    /**
     * Resolve the immutable cost of each sale item.
     *
     * Composition cost is the sum of the final component run-item snapshots.
     * `composition_runs.total_cost` is not used here because it is null when
     * any line is uncosted; the run items retain the known subtotal and count.
     *
     * @param  int[]  $saleItemIds
     * @return array<int, array{
     *     is_composition: bool,
     *     base_quantity: float,
     *     unit_cost: float|null,
     *     total_cost: float,
     *     cost_complete: bool,
     *     cost_basis: string|null,
     *     uncosted_lines: int,
     *     uncosted_quantity: float,
     *     component_lines: int
     * }>
     */
    public function lineCostsForSaleItemIds(array $saleItemIds): array
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', $saleItemIds))));

        if ($ids === []) {
            return [];
        }

        $items = DB::table('sale_items')
            ->whereIn('id', $ids)
            ->select('id', 'base_quantity', 'cost_price', 'cost_complete', 'uncosted_quantity')
            ->get()
            ->keyBy('id');

        $runCounts = DB::table('composition_runs')
            ->whereIn('sale_item_id', $ids)
            ->where('status', 'completed')
            ->select('sale_item_id', DB::raw('COUNT(*) as run_count'))
            ->groupBy('sale_item_id')
            ->pluck('run_count', 'sale_item_id');

        $composition = DB::table('composition_runs as cr')
            ->join('composition_run_items as cri', 'cri.composition_run_id', '=', 'cr.id')
            ->whereIn('cr.sale_item_id', $ids)
            ->where('cr.status', 'completed')
            ->select(
                'cr.sale_item_id',
                DB::raw('SUM(COALESCE(cri.total_cost, 0)) as known_cost'),
                DB::raw('SUM(CASE WHEN cri.total_cost IS NULL THEN 1 ELSE 0 END) as uncosted_lines'),
                DB::raw("SUM(CASE WHEN cri.cost_basis = 'estimated' THEN 1 ELSE 0 END) as estimated_lines"),
                DB::raw('COUNT(cri.id) as component_lines')
            )
            ->groupBy('cr.sale_item_id')
            ->get()
            ->keyBy('sale_item_id');

        $result = [];

        foreach ($items as $item) {
            $id = (int) $item->id;
            $baseQuantity = (float) $item->base_quantity;
            $hasRuns = (int) ($runCounts[$id] ?? 0) > 0;
            $compositionLine = $composition->get($id);

            if ($hasRuns) {
                $componentLines = $compositionLine === null ? 0 : (int) $compositionLine->component_lines;
                $knownCost = $compositionLine === null ? 0.0 : (float) $compositionLine->known_cost;
                $uncostedLines = $compositionLine === null ? 0 : (int) $compositionLine->uncosted_lines;
                $estimatedLines = $compositionLine === null ? 0 : (int) $compositionLine->estimated_lines;

                if ($componentLines === 0 && $uncostedLines === 0) {
                    $uncostedLines = 1;
                }

                $costBasis = match (true) {
                    $uncostedLines > 0 => $knownCost > 0 ? 'partial' : 'unavailable',
                    $estimatedLines > 0 => 'estimated',
                    default => 'exact',
                };

                $result[$id] = [
                    'is_composition' => true,
                    'base_quantity' => $baseQuantity,
                    'unit_cost' => $baseQuantity > 0 ? round($knownCost / $baseQuantity, 6) : null,
                    'total_cost' => round($knownCost, 6),
                    'cost_complete' => $uncostedLines === 0,
                    'cost_basis' => $costBasis,
                    'uncosted_lines' => $uncostedLines,
                    'uncosted_quantity' => 0.0,
                    'component_lines' => $componentLines,
                ];

                continue;
            }

            $unitCost = $item->cost_price === null ? null : (float) $item->cost_price;
            $costComplete = (bool) ($item->cost_complete ?? true);
            $result[$id] = [
                'is_composition' => false,
                'base_quantity' => $baseQuantity,
                'unit_cost' => $unitCost,
                'total_cost' => round($baseQuantity * (float) ($item->cost_price ?? 0), 6),
                'cost_complete' => $costComplete,
                'cost_basis' => null,
                'uncosted_lines' => $costComplete ? 0 : 1,
                'uncosted_quantity' => (float) ($item->uncosted_quantity ?? 0),
                'component_lines' => 0,
            ];
        }

        return $result;
    }

    public function returned(string $from, string $to): float
    {
        $rows = DB::table('return_items')
            ->join('returns', 'returns.id', '=', 'return_items.return_id')
            ->whereNull('returns.deleted_at')
            ->where('returns.type', 'SALE')
            ->where('returns.status', 'completed')
            ->whereBetween('returns.return_date', [$from, $to])
            ->select('return_items.reference_item_id', 'return_items.base_quantity')
            ->get();

        if ($rows->isEmpty()) {
            return 0.0;
        }

        $lineCosts = $this->lineCostsForSaleItemIds(
            $rows->pluck('reference_item_id')->all()
        );

        $returned = 0.0;

        foreach ($rows as $row) {
            $line = $lineCosts[(int) $row->reference_item_id] ?? null;

            if ($line === null || $line['base_quantity'] <= 0) {
                continue;
            }

            $returned += (float) $row->base_quantity
                * ($line['total_cost'] / $line['base_quantity']);
        }

        return round($returned, 6);
    }

    /**
     * @return array<int, float> sale_item_id => returned base quantity
     */
    public function returnedQuantityByItem(string $from, string $to): array
    {
        return DB::table('return_items')
            ->join('returns', 'returns.id', '=', 'return_items.return_id')
            ->whereNull('returns.deleted_at')
            ->where('returns.type', 'SALE')
            ->where('returns.status', 'completed')
            ->whereBetween('returns.return_date', [$from, $to])
            ->select('return_items.reference_item_id', DB::raw('SUM(return_items.base_quantity) as qty'))
            ->groupBy('return_items.reference_item_id')
            ->pluck('qty', 'reference_item_id')
            ->map(fn ($qty) => (float) $qty)
            ->all();
    }
}
