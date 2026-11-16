<?php

namespace App\Domains\Composition\Services;

use App\Domains\Inventory\Services\InventoryService;
use App\Domains\Returns\DTOs\ReturnItemData;
use App\Models\CompositionRun;
use App\Models\ReturnComponentRecovery;
use App\Models\ReturnItem;
use App\Models\ReturnModel;
use App\Models\SaleItem;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Material recovery for composition sales.
 *
 * Separation of concerns:
 *   - the commercial return (refund, credit note, returned quantity) is owned
 *     by ReturnService;
 *   - material recovery is owned by this service and only ever restores
 *     component inventory that a user explicitly declares as physically
 *     recovered.
 *
 * A refund alone never restores components.
 */
class CompositionReturnRecoveryService
{
    private const EPSILON = 0.000001;

    public function __construct(
        private readonly InventoryService $inventory,
    ) {}

    // ─── Detection ─────────────────────────────────────────────

    /**
     * Whether a sale line consumed composition components at checkout.
     */
    public function isCompositionSaleItem(int $saleItemId): bool
    {
        return CompositionRun::query()
            ->where('sale_item_id', $saleItemId)
            ->where('status', CompositionRun::STATUS_COMPLETED)
            ->exists();
    }

    /**
     * @return int[] sale item ids that consumed composition components
     */
    public function compositionSaleItemIds(array $saleItemIds): array
    {
        if ($saleItemIds === []) {
            return [];
        }

        return CompositionRun::query()
            ->whereIn('sale_item_id', $saleItemIds)
            ->where('status', CompositionRun::STATUS_COMPLETED)
            ->distinct()
            ->pluck('sale_item_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    // ─── Eligibility ───────────────────────────────────────────

    /**
     * Recoverable component lines for one returned commercial quantity.
     *
     * Eligibility is proportional to the cumulative returned quantity of the
     * sale line and net of material already restored by completed returns.
     *
     * The recoverable basis excludes wastage: it is
     * min(template_quantity, actual_quantity) of the immutable run item.
     *
     * @return array<int, array{
     *     composition_run_item_id: int,
     *     composition_run_id: int,
     *     component_product_id: int,
     *     component_name: string|null,
     *     unit: string,
     *     basis_quantity: float,
     *     eligible_quantity: float,
     *     restored_quantity: float,
     *     wastage_quantity: float,
     *     unit_cost: float|null,
     *     cost_basis: string|null
     * }>
     */
    public function eligibleLines(SaleItem $saleItem, float $returnQuantity): array
    {
        $runs = CompositionRun::query()
            ->where('sale_item_id', $saleItem->id)
            ->where('status', CompositionRun::STATUS_COMPLETED)
            ->with('items')
            ->orderBy('id')
            ->get();

        if ($runs->isEmpty()) {
            return [];
        }

        $soldQuantity = (float) $saleItem->base_quantity;

        if ($soldQuantity <= 0) {
            return [];
        }

        $previouslyReturned = (float) ReturnModel::returnedQuantityForItem('sale_item', (int) $saleItem->id);
        $cumulativeReturned = $previouslyReturned + max(0, $returnQuantity);
        $proportion = min(1.0, $cumulativeReturned / $soldQuantity);

        $lines = [];

        foreach ($runs as $run) {
            foreach ($run->items as $runItem) {
                $basis = $this->recoverableBasis($runItem);

                if ($basis <= 0) {
                    continue;
                }

                $restored = $this->restoredQuantity((int) $runItem->id);
                $eligible = max(0.0, round($basis * $proportion, 6) - $restored);

                $lines[(int) $runItem->id] = [
                    'composition_run_item_id' => (int) $runItem->id,
                    'composition_run_id' => (int) $run->id,
                    'component_product_id' => (int) $runItem->component_product_id,
                    'component_name' => $runItem->component_name,
                    'unit' => $runItem->unit,
                    'basis_quantity' => round($basis, 6),
                    'eligible_quantity' => round($eligible, 6),
                    'restored_quantity' => round($restored, 6),
                    'wastage_quantity' => round(max(0.0, (float) $runItem->actual_quantity - $basis), 6),
                    'unit_cost' => $runItem->unit_cost === null ? null : (float) $runItem->unit_cost,
                    'cost_basis' => $runItem->cost_basis,
                ];
            }
        }

        return $lines;
    }

    /**
     * Recoverable material for a run item.
     *
     * P3 stores the scaled template quantity (material that became the product)
     * and the actual consumed quantity (template plus wastage, or an explicit
     * runtime override). Wastage is never recoverable. For an explicit runtime
     * override, the recorded actual quantity is the consumed material and is the
     * recoverable basis, even when the cashier used more than the default.
     */
    private function recoverableBasis($runItem): float
    {
        $sources = $runItem->source_breakdown;

        if (is_array($sources) && $sources !== []) {
            $basis = 0.0;

            foreach ($sources as $source) {
                $sourceTemplate = (float) ($source['template_quantity'] ?? 0);
                $sourceActual = (float) ($source['actual_quantity'] ?? 0);

                // An explicit runtime override is the actual material consumed;
                // no template wastage was applied to it. Without an override,
                // exclude wastage from the recoverable ceiling.
                $basis += ! empty($source['overridden'])
                    ? $sourceActual
                    : min($sourceTemplate, $sourceActual);
            }

            return max(0.0, round($basis, 6));
        }

        $template = (float) $runItem->template_quantity;
        $actual = (float) $runItem->actual_quantity;

        return max(0.0, min($template, $actual));
    }

    /**
     * Material already restored by completed returns for one consumed line.
     */
    private function restoredQuantity(int $runItemId): float
    {
        return (float) ReturnComponentRecovery::query()
            ->join('returns', 'returns.id', '=', 'return_component_recoveries.return_id')
            ->where('return_component_recoveries.composition_run_item_id', $runItemId)
            ->whereNotNull('return_component_recoveries.restored_at')
            ->where('returns.status', 'completed')
            ->whereNull('returns.deleted_at')
            ->sum('return_component_recoveries.recovered_quantity');
    }

    // ─── Validation ────────────────────────────────────────────

    /**
     * Validate the material recoveries declared for one return line.
     *
     * @param  array<int, array{composition_run_item_id: int, quantity: float}>  $declared
     * @return array<int, array<string, mixed>> normalized recovery rows
     *
     * @throws ValidationException
     */
    public function resolveDeclaredRecoveries(ReturnItemData $item, SaleItem $saleItem): array
    {
        $declared = $item->recoveries();

        if ($declared === []) {
            return [];
        }

        $eligible = $this->eligibleLines($saleItem, $item->quantity);

        if ($eligible === []) {
            throw ValidationException::withMessages([
                'items' => "No composition consumption is recorded for '{$item->productName}', so no material can be restored.",
            ]);
        }

        $resolved = [];
        $seen = [];

        foreach ($declared as $row) {
            $runItemId = (int) $row['composition_run_item_id'];
            $quantity = (float) $row['quantity'];

            if ($quantity <= 0) {
                throw ValidationException::withMessages([
                    'items' => "Recovered material quantity for '{$item->productName}' must be greater than zero.",
                ]);
            }

            if (isset($seen[$runItemId])) {
                throw ValidationException::withMessages([
                    'items' => "The same consumed component was declared twice for '{$item->productName}'.",
                ]);
            }

            $seen[$runItemId] = true;

            if (! isset($eligible[$runItemId])) {
                throw ValidationException::withMessages([
                    'items' => "A recovered component does not belong to the original composition run of '{$item->productName}'.",
                ]);
            }

            $line = $eligible[$runItemId];

            if ($quantity > $line['eligible_quantity'] + self::EPSILON) {
                $name = $line['component_name'] ?? 'Component';

                throw ValidationException::withMessages([
                    'items' => "Cannot restore {$quantity} {$line['unit']} of '{$name}': ".
                        "only {$line['eligible_quantity']} is recoverable for this return ".
                        "(consumed basis {$line['basis_quantity']}, already restored {$line['restored_quantity']}, ".
                        'wastage is not recoverable).',
                ]);
            }

            $resolved[] = $line + [
                'recovered_quantity' => round($quantity, 6),
                'total_cost' => $line['unit_cost'] === null
                    ? null
                    : round($quantity * $line['unit_cost'], 6),
            ];
        }

        return $resolved;
    }

    // ─── Declaration (pending return) ──────────────────────────

    /**
     * Persist declared recoveries. No inventory movement is written here; the
     * rows become effective only when the return completes.
     *
     * @param  array<int, array<string, mixed>>  $resolved
     */
    public function declare(ReturnModel $return, ReturnItem $returnItem, array $resolved): void
    {
        foreach ($resolved as $line) {
            ReturnComponentRecovery::create([
                'return_id' => $return->id,
                'return_item_id' => $returnItem->id,
                'composition_run_id' => $line['composition_run_id'],
                'composition_run_item_id' => $line['composition_run_item_id'],
                'component_product_id' => $line['component_product_id'],
                'component_name' => $line['component_name'],
                'unit' => $line['unit'],
                'basis_quantity' => $line['basis_quantity'],
                'eligible_quantity' => $line['eligible_quantity'],
                'recovered_quantity' => $line['recovered_quantity'],
                'unit_cost' => $line['unit_cost'],
                'total_cost' => $line['total_cost'],
                'created_by' => $return->created_by,
            ]);
        }
    }

    // ─── Restoration (inside the return transaction) ───────────

    /**
     * Restore recovered material to inventory.
     *
     * Must be called inside the return completion transaction. Every movement
     * is a canonical `sale-return` inventory transaction referencing the return
     * document, so reversing the return compensates it automatically.
     *
     * @return int number of restored component lines
     */
    public function restore(ReturnModel $return, ReturnItem $returnItem, SaleItem $saleItem): int
    {
        $declared = ReturnComponentRecovery::query()
            ->where('return_item_id', $returnItem->id)
            ->orderBy('id')
            ->get();

        if ($declared->isEmpty()) {
            return 0;
        }

        // Re-validate against live state: another return may have completed
        // between creation and completion of this one.
        $eligible = $this->eligibleLines($saleItem, (float) $returnItem->quantity);
        $documentDate = $return->return_date?->format('Y-m-d');
        $restored = 0;

        foreach ($declared as $recovery) {
            if ($recovery->restored_at !== null) {
                // Already applied — completing twice is blocked upstream, but a
                // retry must never create a second movement.
                continue;
            }

            $runItemId = (int) $recovery->composition_run_item_id;
            $quantity = (float) $recovery->recovered_quantity;

            if (! isset($eligible[$runItemId])) {
                throw ValidationException::withMessages([
                    'items' => "Recovered material no longer belongs to a completed composition run of '{$returnItem->product_name}'.",
                ]);
            }

            $line = $eligible[$runItemId];

            if ($quantity > $line['eligible_quantity'] + self::EPSILON) {
                throw ValidationException::withMessages([
                    'items' => "Cannot restore {$quantity} {$line['unit']} of '".($line['component_name'] ?? 'Component')."': ".
                        "only {$line['eligible_quantity']} remains recoverable after other returns.",
                ]);
            }

            $movement = $this->inventory->recordReturn(
                productId: (int) $recovery->component_product_id,
                quantity: $quantity,
                returnType: 'sale',
                reference: $return->return_number,
                notes: 'Recovered material — '.$return->return_number,
                user: $return->created_by,
                referenceId: $return->id,
                unitCost: $recovery->unit_cost,
                documentDate: $documentDate,
            );

            $recovery->forceFill([
                'eligible_quantity' => $line['eligible_quantity'],
                'inventory_transaction_id' => $movement->id,
                'restored_at' => now(),
            ])->save();

            $restored++;
        }

        return $restored;
    }

    // ─── Read model for the return UI ──────────────────────────

    /**
     * Recovery capability per sale item for the return screen.
     *
     * Amounts are per commercial unit so the client can display the ceiling for
     * the quantity the user types. The server remains authoritative.
     *
     * @param  Collection<int, Sale>|array  $sales
     * @return array<int, array<string, mixed>>
     */
    public function contextForSales($sales): array
    {
        $context = [];

        foreach ($sales as $sale) {
            foreach ($sale->items as $item) {
                $runItems = CompositionRun::query()
                    ->where('sale_item_id', $item->id)
                    ->where('status', CompositionRun::STATUS_COMPLETED)
                    ->with('items')
                    ->get()
                    ->flatMap(fn ($run) => $run->items);

                if ($runItems->isEmpty()) {
                    continue;
                }

                $sold = (float) $item->base_quantity;
                $previouslyReturned = (float) ReturnModel::returnedQuantityForItem('sale_item', (int) $item->id);
                $remaining = max(0.0, $sold - $previouslyReturned);

                $components = $runItems->map(function ($runItem) use ($sold, $previouslyReturned, $remaining) {
                    $basis = $this->recoverableBasis($runItem);
                    $restored = $this->restoredQuantity((int) $runItem->id);
                    $perUnit = $sold > 0 ? $basis / $sold : 0.0;

                    return [
                        'composition_run_item_id' => (int) $runItem->id,
                        'component_name' => $runItem->component_name,
                        'unit' => $runItem->unit,
                        'per_unit_quantity' => round($perUnit, 6),
                        'restored_quantity' => round($restored, 6),
                        'wastage_quantity' => round(max(0.0, (float) $runItem->actual_quantity - $basis), 6),
                        'eligible_for_remaining' => $remaining > 0
                            ? round(max(0.0, $basis * min(1.0, ($previouslyReturned + $remaining) / max($sold, self::EPSILON)) - $restored), 6)
                            : 0.0,
                    ];
                })->values()->all();

                $context[(int) $item->id] = [
                    'sale_item_id' => (int) $item->id,
                    'product_name' => $item->product_name,
                    'sold_quantity' => round($sold, 6),
                    'previously_returned' => round($previouslyReturned, 6),
                    'remaining_quantity' => round($remaining, 6),
                    'components' => $components,
                ];
            }
        }

        return $context;
    }
}
