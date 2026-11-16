<?php

namespace App\Domains\Composition\Services;

use App\Domains\Composition\DTOs\CompositionItemOverrideData;
use App\Domains\Composition\DTOs\ExecuteCompositionData;
use App\Domains\Composition\Exceptions\InsufficientComponentStockException;
use App\Domains\Inventory\Services\CostResolver;
use App\Domains\Inventory\Services\InventoryService;
use App\Domains\Products\Services\ProductUnitService;
use App\Models\AuditLog;
use App\Models\CompositionRun;
use App\Models\Product;
use App\Models\ProductComposition;
use Illuminate\Database\QueryException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Executes an active consumption composition against the inventory ledger.
 *
 * The service owns its transaction boundary. Callers must not wrap it in a
 * second transaction — doing so would move the stock preflight outside the
 * locking window and weaken the atomicity guarantees.
 */
class CompositionExecutionService
{
    private const MAX_DEPTH = 20;

    private const EPSILON = 0.000001;

    public function __construct(
        private readonly InventoryService $inventory,
        private readonly CostResolver $costs,
        private readonly ProductUnitService $units,
    ) {}

    public function execute(ExecuteCompositionData $data): CompositionRun
    {
        $this->assertExecutionQuantity($data);

        $idempotencyKey = $this->normalizeIdempotencyKey($data->idempotencyKey);

        if ($idempotencyKey !== null) {
            $existing = $this->findExisting($idempotencyKey);
            if ($existing !== null) {
                return $existing;
            }
        }

        try {
            return DB::transaction(fn () => $this->executeInTransaction(
                $data,
                $idempotencyKey,
                ProductComposition::KIND_CONSUMPTION,
            ));
        } catch (QueryException $exception) {
            // A concurrent duplicate may have won the idempotency-key insert
            // while this request was waiting on the product locks.
            if ($idempotencyKey !== null) {
                $existing = $this->findExisting($idempotencyKey);
                if ($existing !== null) {
                    return $existing;
                }
            }

            throw $exception;
        }
    }

    /**
     * Execute inside a caller-owned transaction.
     *
     * Used by sale checkout so the sale, items, run, and component movements
     * commit or roll back together. The caller must already be inside
     * DB::transaction(); this method deliberately does not open a nested one.
     */
    public function executeWithinTransaction(
        ExecuteCompositionData $data,
        string $requiredKind = ProductComposition::KIND_CONSUMPTION,
    ): CompositionRun {
        $this->assertExecutionQuantity($data);

        $idempotencyKey = $this->normalizeIdempotencyKey($data->idempotencyKey);

        if ($idempotencyKey !== null) {
            $existing = $this->findExisting($idempotencyKey);
            if ($existing !== null) {
                return $existing;
            }
        }

        return $this->executeInTransaction($data, $idempotencyKey, $requiredKind);
    }

    private function assertExecutionQuantity(ExecuteCompositionData $data): void
    {
        if (! is_finite($data->quantity) || $data->quantity <= 0) {
            throw ValidationException::withMessages([
                'quantity' => 'The execution quantity must be greater than zero.',
            ]);
        }
    }

    /**
     * Resolve and expand an execution request without touching stock.
     *
     * Shared by real execution and the read-only cost preview so both agree on
     * which components are consumed and in what quantity.
     *
     * @return array{0: ProductComposition, 1: Product, 2: string, 3: float, 4: array<int, array<string, mixed>>}
     */
    private function prepareExecution(ExecuteCompositionData $data, string $requiredKind): array
    {
        $composition = ProductComposition::query()
            ->with('items')
            ->find($data->compositionId);

        if ($composition === null) {
            throw ValidationException::withMessages([
                'composition_id' => 'The composition does not exist.',
            ]);
        }

        if (! $composition->is_active) {
            throw ValidationException::withMessages([
                'composition_id' => 'Inactive compositions cannot be executed.',
            ]);
        }

        if ($composition->kind !== $requiredKind) {
            throw ValidationException::withMessages([
                'composition_id' => "This operation requires a {$requiredKind} composition.",
            ]);
        }

        $parent = Product::withArchived()->withTrashed()->find($composition->product_id);

        if ($parent === null || $parent->archived_at !== null || $parent->trashed()) {
            throw ValidationException::withMessages([
                'product_id' => 'The composition product must exist and be active.',
            ]);
        }

        $parentBaseUnit = $parent->base_unit_id ?: 'piece';
        $outputUnitId = $data->quantityUnitId ?: ($composition->output_unit_id ?: $parentBaseUnit);

        $executionBaseQuantity = $this->convertOrFail(
            $data->quantity,
            $outputUnitId,
            $parentBaseUnit,
            'quantity_unit_id',
        );

        $templateOutputBase = $this->convertOrFail(
            (float) $composition->output_quantity,
            $composition->output_unit_id ?: $parentBaseUnit,
            $parentBaseUnit,
            'output_unit_id',
        );

        $scale = $executionBaseQuantity / $templateOutputBase;

        $optionalMap = $this->optionalMap($data->optionalItemIds);
        $overrideMap = $this->overrideMap($data->overrides);

        $seenItemIds = [];

        $requirements = $this->explode(
            $composition,
            $scale,
            0,
            [$parent->id],
            $optionalMap,
            $overrideMap,
            $seenItemIds,
        );

        $this->assertSelectionsSeen($optionalMap, $overrideMap, $seenItemIds);

        if ($requirements === []) {
            throw ValidationException::withMessages([
                'items' => 'The composition has no components selected for execution.',
            ]);
        }

        return [$composition, $parent, $outputUnitId, $executionBaseQuantity, $this->aggregate($requirements)];
    }

    /**
     * Read-only cost of an execution request.
     *
     * Performs no locking, no writes and no stock preflight: a preview must not
     * fail merely because stock is short, and must never influence inventory.
     *
     * @return array{lines: array<int, array<string, mixed>>, total_cost: float|null, complete: bool, cost_basis: string}
     */
    public function previewRequirements(
        ExecuteCompositionData $data,
        string $requiredKind = ProductComposition::KIND_CONSUMPTION,
    ): array {
        [, , , , $aggregated] = $this->prepareExecution($data, $requiredKind);

        $products = Product::withArchived()
            ->withTrashed()
            ->whereIn('id', array_keys($aggregated))
            ->get()
            ->keyBy('id');

        $this->applyCosts($aggregated, $products);

        $rank = ['exact' => 0, 'estimated' => 1, 'unavailable' => 2];
        $worst = 0;
        $total = 0.0;
        $complete = true;
        $lines = [];

        foreach ($aggregated as $componentProductId => $line) {
            $lineTotal = $line['total_cost'];

            if ($lineTotal === null) {
                $complete = false;
            } else {
                $total += (float) $lineTotal;
            }

            $basis = (string) ($line['cost_basis'] ?? 'unavailable');
            $worst = max($worst, $rank[$basis] ?? 2);

            $lines[] = [
                'component_product_id' => $componentProductId,
                'component_name' => $line['component_name'] ?? null,
                'unit' => $line['base_unit_id'] ?? null,
                'actual_quantity' => round((float) $line['actual_quantity'], 6),
                'unit_cost' => $line['unit_cost'],
                'total_cost' => $lineTotal,
                'cost_basis' => $basis,
            ];
        }

        return [
            'lines' => $lines,
            'total_cost' => $complete ? round($total, 6) : null,
            'complete' => $complete,
            'cost_basis' => array_search($worst, $rank, true) ?: 'unavailable',
        ];
    }

    private function executeInTransaction(
        ExecuteCompositionData $data,
        ?string $idempotencyKey,
        string $requiredKind,
    ): CompositionRun {
        [$composition, $parent, $outputUnitId, $executionBaseQuantity, $aggregated]
            = $this->prepareExecution($data, $requiredKind);

        $lockIds = array_keys($aggregated);
        $lockIds[] = $parent->id;
        $lockedProducts = $this->lockProducts($lockIds);

        // CompositionService locks the product before the composition row. Use
        // the same order, then verify that the version we exploded is still the
        // active version.
        $lockedComposition = ProductComposition::query()
            ->whereKey($composition->id)
            ->lockForUpdate()
            ->first();

        if (
            $lockedComposition === null
            || ! $lockedComposition->is_active
            || (int) $lockedComposition->version !== (int) $composition->version
        ) {
            throw ValidationException::withMessages([
                'composition_id' => 'The composition changed during execution. Retry the operation.',
            ]);
        }

        $run = CompositionRun::create([
            'run_number' => $this->newRunNumber(),
            'idempotency_key' => $idempotencyKey,
            'composition_id' => $composition->id,
            'product_id' => $composition->product_id,
            'kind' => $composition->kind,
            'output_unit_id' => $outputUnitId,
            'source_type' => $data->sourceType ?: 'manual',
            'source_id' => $data->sourceId,
            'sale_item_id' => $data->saleItemId,
            'reference' => $data->reference,
            'template_version' => $composition->version,
            'template_snapshot' => $this->snapshot($composition),
            'quantity' => $data->quantity,
            'output_quantity' => $executionBaseQuantity,
            'status' => CompositionRun::STATUS_PENDING,
            'created_by' => $data->createdBy,
            'location' => $data->location ?: $parent->location,
        ]);

        // The pending run claims the idempotency key before stock validation,
        // so concurrent duplicates collide here instead of failing the
        // preflight after the winning request has already consumed stock.
        $this->preflight($aggregated, $lockedProducts);

        $this->applyCosts($aggregated, $lockedProducts);

        $movements = [];
        foreach ($aggregated as $componentProductId => $line) {
            $movements[$componentProductId] = $this->inventory->recordConsumption(
                productId: $componentProductId,
                quantity: $line['actual_quantity'],
                reference: $data->reference ?: $run->run_number,
                notes: 'Composition run '.$run->run_number,
                user: $data->createdBy,
                referenceId: $run->id,
                unitCost: $line['unit_cost'],
                documentDate: $data->documentDate,
            );
        }

        [$totalCost, $runCostBasis] = $this->runCost($aggregated);

        foreach ($aggregated as $componentProductId => $line) {
            $run->items()->create([
                'component_product_id' => $componentProductId,
                'component_name' => $line['component_name'],
                'component_sku' => $line['component_sku'],
                'unit' => $line['base_unit_id'],
                'display_unit_id' => $line['display_unit_id'],
                'display_quantity' => $line['display_quantity'],
                'template_quantity' => $line['template_quantity'],
                'actual_quantity' => $line['actual_quantity'],
                'wastage_pct' => $line['wastage_pct'],
                'is_optional' => $line['is_optional'],
                'unit_cost' => $line['unit_cost'],
                'total_cost' => $line['total_cost'],
                'cost_basis' => $line['cost_basis'],
                'source_breakdown' => $line['sources'],
                'inventory_transaction_id' => $movements[$componentProductId]->id,
            ]);
        }

        $run->update([
            'total_cost' => $totalCost,
            'unit_cost' => $totalCost === null ? null : round($totalCost / $executionBaseQuantity, 6),
            'cost_basis' => $runCostBasis,
            'status' => CompositionRun::STATUS_COMPLETED,
            'effects_applied_at' => now(),
        ]);

        AuditLog::create([
            'user_id' => $data->userId,
            'event' => 'composition.executed',
            'auditable_type' => CompositionRun::class,
            'auditable_id' => $run->id,
            'description' => sprintf(
                "Composition '%s' v%d executed for product '%s' (run %s) by %s",
                $composition->name ?: 'Unnamed formula',
                $composition->version,
                $parent->name,
                $run->run_number,
                $data->createdBy ?: 'system',
            ),
            'reason' => $data->reference,
            'ip_address' => app()->runningInConsole() ? null : request()->ip(),
        ]);

        $run->load('items');

        return $run;
    }

    /**
     * Recursively expand a composition into stock-level requirements.
     *
     * Only nested consumption compositions are exploded. An assembly component
     * is a stocked product in P3; manufacturing its output belongs to P7.
     */
    private function explode(
        ProductComposition $composition,
        float $scale,
        int $depth,
        array $ancestors,
        array $optionalMap,
        array $overrideMap,
        array &$seenItemIds,
    ): array {
        if ($depth > self::MAX_DEPTH) {
            throw ValidationException::withMessages([
                'items' => 'Composition nesting is too deep.',
            ]);
        }

        $composition->loadMissing('items');

        if ($composition->items->isEmpty()) {
            throw ValidationException::withMessages([
                'items' => 'A nested composition must contain at least one component.',
            ]);
        }

        $requirements = [];

        foreach ($composition->items as $item) {
            $itemId = (int) $item->id;
            $seenItemIds[$itemId] = true;
            $isOptional = (bool) $item->is_optional;

            if (! $isOptional && isset($optionalMap[$itemId])) {
                throw ValidationException::withMessages([
                    'optional_item_ids' => 'A mandatory component cannot be selected as optional.',
                ]);
            }

            if ($isOptional && ! isset($optionalMap[$itemId])) {
                if (isset($overrideMap[$itemId])) {
                    throw ValidationException::withMessages([
                        'overrides' => 'An omitted optional component cannot be overridden.',
                    ]);
                }

                continue;
            }

            $component = Product::withArchived()->withTrashed()->find($item->component_product_id);

            if ($component === null || $component->archived_at !== null || $component->trashed()) {
                throw ValidationException::withMessages([
                    'items' => 'A composition component must exist and be active.',
                ]);
            }

            if (! $component->track_inventory) {
                throw ValidationException::withMessages([
                    'items' => 'A composition component must track inventory.',
                ]);
            }

            $baseUnitId = $component->base_unit_id ?: 'piece';
            $templateQuantity = round((float) $item->quantity_base * $scale, 6);
            $override = $overrideMap[$itemId] ?? null;

            if ($override !== null) {
                $actualQuantity = $this->convertOrFail(
                    $override->quantity,
                    $override->unitId ?: $baseUnitId,
                    $baseUnitId,
                    'overrides',
                );
            } else {
                $actualQuantity = $templateQuantity * (1 + ((float) $item->wastage_pct / 100));
            }

            $actualQuantity = round($actualQuantity, 6);

            if ($templateQuantity <= 0 || $actualQuantity <= 0) {
                throw ValidationException::withMessages([
                    'items' => 'Every executed component quantity must be greater than zero.',
                ]);
            }

            $nested = ProductComposition::query()
                ->where('product_id', $component->id)
                ->where('kind', ProductComposition::KIND_CONSUMPTION)
                ->where('is_active', true)
                ->with('items')
                ->orderByDesc('version')
                ->first();

            if ($nested !== null) {
                if (in_array($component->id, $ancestors, true)) {
                    throw ValidationException::withMessages([
                        'items' => 'The composition would create a consumption cycle.',
                    ]);
                }

                if ($depth >= self::MAX_DEPTH) {
                    throw ValidationException::withMessages([
                        'items' => 'Composition nesting is too deep.',
                    ]);
                }

                $nestedOutputBase = $this->convertOrFail(
                    (float) $nested->output_quantity,
                    $nested->output_unit_id ?: $baseUnitId,
                    $baseUnitId,
                    'items',
                );

                $requirements = array_merge(
                    $requirements,
                    $this->explode(
                        $nested,
                        $actualQuantity / $nestedOutputBase,
                        $depth + 1,
                        [...$ancestors, $component->id],
                        $optionalMap,
                        $overrideMap,
                        $seenItemIds,
                    ),
                );

                continue;
            }

            if (in_array($component->id, $ancestors, true)) {
                throw ValidationException::withMessages([
                    'items' => 'The composition would create a consumption cycle.',
                ]);
            }

            $displayUnitId = $item->display_unit_id ?: $baseUnitId;
            $displayQuantity = $this->units->convert($actualQuantity, $baseUnitId, $displayUnitId);

            if ($displayQuantity === null) {
                throw ValidationException::withMessages([
                    'items' => 'A component display unit is not compatible with its base unit.',
                ]);
            }

            $source = [
                'composition_id' => $composition->id,
                'composition_version' => $composition->version,
                'composition_kind' => $composition->kind,
                'composition_item_id' => $itemId,
                'depth' => $depth,
                'template_quantity' => $templateQuantity,
                'actual_quantity' => $actualQuantity,
                'wastage_pct' => (float) $item->wastage_pct,
                'is_optional' => $isOptional,
                'overridden' => $override !== null,
                'display_unit_id' => $displayUnitId,
                'display_quantity' => round($displayQuantity, 6),
            ];

            $requirements[] = [
                'component_product_id' => $component->id,
                'component_name' => $component->name,
                'component_sku' => $component->sku,
                'base_unit_id' => $baseUnitId,
                'template_quantity' => $templateQuantity,
                'actual_quantity' => $actualQuantity,
                'wastage_pct' => 0.0,
                'is_optional' => $isOptional,
                'display_unit_id' => $displayUnitId,
                'display_quantity' => round($displayQuantity, 6),
                'source' => $source,
            ];
        }

        return $requirements;
    }

    /**
     * Aggregate repeated inventory products while retaining every source row.
     *
     * @param  array<int, array<string, mixed>>  $requirements
     * @return array<int, array<string, mixed>>
     */
    private function aggregate(array $requirements): array
    {
        $aggregated = [];

        foreach ($requirements as $requirement) {
            $componentProductId = (int) $requirement['component_product_id'];

            if (! isset($aggregated[$componentProductId])) {
                $aggregated[$componentProductId] = [
                    'component_product_id' => $componentProductId,
                    'component_name' => $requirement['component_name'],
                    'component_sku' => $requirement['component_sku'],
                    'base_unit_id' => $requirement['base_unit_id'],
                    'display_unit_id' => $requirement['display_unit_id'],
                    'display_quantity' => null,
                    'template_quantity' => 0.0,
                    'actual_quantity' => 0.0,
                    'wastage_pct' => 0.0,
                    'is_optional' => true,
                    'unit_cost' => null,
                    'total_cost' => null,
                    'cost_basis' => 'unavailable',
                    'sources' => [],
                ];
            }

            $line = &$aggregated[$componentProductId];
            $line['template_quantity'] += $requirement['template_quantity'];
            $line['actual_quantity'] += $requirement['actual_quantity'];
            $line['is_optional'] = $line['is_optional'] && $requirement['is_optional'];

            if ($line['display_unit_id'] !== $requirement['display_unit_id']) {
                $line['display_unit_id'] = null;
            }

            $line['sources'][] = $requirement['source'];
            unset($line);
        }

        ksort($aggregated);

        foreach ($aggregated as &$line) {
            $line['template_quantity'] = round($line['template_quantity'], 6);
            $line['actual_quantity'] = round($line['actual_quantity'], 6);

            if ($line['actual_quantity'] <= 0) {
                throw ValidationException::withMessages([
                    'items' => 'Every executed component quantity must be greater than zero.',
                ]);
            }

            $wastageWeight = 0.0;
            $wastageTotal = 0.0;
            foreach ($line['sources'] as $source) {
                $sourceWeight = (float) $source['template_quantity'];
                $wastageWeight += $sourceWeight;
                $wastageTotal += ((float) $source['wastage_pct']) * $sourceWeight;
            }

            $line['wastage_pct'] = $wastageWeight > 0
                ? round($wastageTotal / $wastageWeight, 3)
                : 0.0;

            if ($line['display_unit_id'] !== null) {
                $displayQuantity = $this->units->convert(
                    $line['actual_quantity'],
                    $line['base_unit_id'],
                    $line['display_unit_id'],
                );

                $line['display_quantity'] = $displayQuantity === null
                    ? null
                    : round($displayQuantity, 6);
            }
        }
        unset($line);

        return $aggregated;
    }

    /**
     * @param  array<int, array<string, mixed>>  $aggregated
     * @param  Collection<int, Product>  $products
     */
    private function preflight(array $aggregated, Collection $products): void
    {
        foreach ($aggregated as $componentProductId => $line) {
            $component = $products->get($componentProductId);

            if ($component === null || $component->archived_at !== null || $component->trashed()) {
                throw ValidationException::withMessages([
                    'items' => 'A composition component must exist and be active.',
                ]);
            }

            if (! $component->track_inventory) {
                throw ValidationException::withMessages([
                    'items' => "Component '{$component->name}' does not track inventory.",
                ]);
            }

            // An ingredient follows the same negative-stock policy as a product
            // sold directly. When the business permits negative stock the
            // consumption is allowed to create a negative balance instead of
            // blocking the whole sale.
            if ($this->inventory->allowsNegativeStock($component)) {
                continue;
            }

            $required = round((float) $line['actual_quantity'], 6);
            $available = round((float) $component->stock_quantity, 6);

            if ($available + self::EPSILON < $required) {
                throw new InsufficientComponentStockException(
                    componentProductId: $component->id,
                    componentName: $component->name,
                    requiredQuantity: $required,
                    availableQuantity: $available,
                );
            }
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $aggregated
     * @param  Collection<int, Product>  $products
     */
    private function applyCosts(array &$aggregated, Collection $products): void
    {
        foreach ($aggregated as $componentProductId => &$line) {
            $component = $products->get($componentProductId);
            $unitCost = $component === null ? null : $this->costs->unitCost($component);
            $costBasis = $component === null ? 'unavailable' : $this->costs->costBasis($component);

            $line['unit_cost'] = $unitCost === null ? null : round((float) $unitCost, 6);
            $line['cost_basis'] = $costBasis;
            $line['total_cost'] = $unitCost === null
                ? null
                : round((float) $line['actual_quantity'] * $unitCost, 6);
        }
        unset($line);
    }

    /**
     * @param  array<int, array<string, mixed>>  $aggregated
     * @return array{0: float|null, 1: string}
     */
    private function runCost(array $aggregated): array
    {
        $rank = ['exact' => 0, 'estimated' => 1, 'unavailable' => 2];
        $worst = 0;
        $complete = true;
        $total = 0.0;

        foreach ($aggregated as $line) {
            if ($line['total_cost'] === null) {
                $complete = false;
            } else {
                $total += (float) $line['total_cost'];
            }

            $worst = max($worst, $rank[$line['cost_basis']] ?? 2);
        }

        return [
            $complete ? round($total, 6) : null,
            array_search($worst, $rank, true) ?: 'unavailable',
        ];
    }

    /**
     * @return Collection<int, Product>
     */
    private function lockProducts(array $ids): Collection
    {
        $ids = array_values(array_unique(array_map('intval', $ids)));
        sort($ids);

        return Product::withArchived()
            ->withTrashed()
            ->whereIn('id', $ids)
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');
    }

    private function snapshot(ProductComposition $composition): array
    {
        $composition->loadMissing('items.component');

        return [
            'id' => $composition->id,
            'product_id' => $composition->product_id,
            'kind' => $composition->kind,
            'version' => $composition->version,
            'name' => $composition->name,
            'output_quantity' => (float) $composition->output_quantity,
            'output_unit_id' => $composition->output_unit_id,
            'items' => $composition->items->map(fn ($item) => [
                'id' => $item->id,
                'component_product_id' => $item->component_product_id,
                'component_name' => $item->component?->name,
                'component_sku' => $item->component?->sku,
                'quantity_base' => (float) $item->quantity_base,
                'display_unit_id' => $item->display_unit_id,
                'wastage_pct' => (float) $item->wastage_pct,
                'is_optional' => (bool) $item->is_optional,
                'sort_order' => (int) $item->sort_order,
            ])->values()->all(),
        ];
    }

    private function convertOrFail(float $value, ?string $fromUnitId, string $toUnitId, string $field): float
    {
        $fromUnitId = $fromUnitId ?: $toUnitId;
        $converted = $this->units->convert($value, $fromUnitId, $toUnitId);

        if ($converted === null || ! is_finite($converted) || $converted <= 0) {
            throw ValidationException::withMessages([
                $field => 'The selected unit is not compatible with the base unit, or the quantity is not valid.',
            ]);
        }

        return $converted;
    }

    /**
     * @param  int[]  $itemIds
     * @return array<int, true>
     */
    private function optionalMap(array $itemIds): array
    {
        $map = [];

        foreach ($itemIds as $itemId) {
            $itemId = (int) $itemId;

            if ($itemId <= 0) {
                throw ValidationException::withMessages([
                    'optional_item_ids' => 'Optional component ids must be positive integers.',
                ]);
            }

            $map[$itemId] = true;
        }

        return $map;
    }

    /**
     * @param  CompositionItemOverrideData[]  $overrides
     * @return array<int, CompositionItemOverrideData>
     */
    private function overrideMap(array $overrides): array
    {
        $map = [];

        foreach ($overrides as $override) {
            if (! $override instanceof CompositionItemOverrideData) {
                throw ValidationException::withMessages([
                    'overrides' => 'Each override must contain a composition item id and quantity.',
                ]);
            }

            if ($override->compositionItemId <= 0) {
                throw ValidationException::withMessages([
                    'overrides' => 'Override composition item ids must be positive integers.',
                ]);
            }

            if (! is_finite($override->quantity) || $override->quantity <= 0) {
                throw ValidationException::withMessages([
                    'overrides' => 'Override quantities must be greater than zero.',
                ]);
            }

            if (isset($map[$override->compositionItemId])) {
                throw ValidationException::withMessages([
                    'overrides' => 'A component cannot be overridden more than once in one execution.',
                ]);
            }

            $map[$override->compositionItemId] = $override;
        }

        return $map;
    }

    /**
     * @param  array<int, true>  $optionalMap
     * @param  array<int, CompositionItemOverrideData>  $overrideMap
     * @param  array<int, true>  $seenItemIds
     */
    private function assertSelectionsSeen(array $optionalMap, array $overrideMap, array $seenItemIds): void
    {
        foreach (array_keys($optionalMap) as $itemId) {
            if (! isset($seenItemIds[$itemId])) {
                throw ValidationException::withMessages([
                    'optional_item_ids' => 'An optional component does not belong to the active composition tree.',
                ]);
            }
        }

        foreach (array_keys($overrideMap) as $itemId) {
            if (! isset($seenItemIds[$itemId])) {
                throw ValidationException::withMessages([
                    'overrides' => 'An overridden component does not belong to the active composition tree.',
                ]);
            }
        }
    }

    private function normalizeIdempotencyKey(?string $key): ?string
    {
        if ($key === null) {
            return null;
        }

        $key = trim($key);

        if ($key === '') {
            return null;
        }

        if (mb_strlen($key) > 100) {
            throw ValidationException::withMessages([
                'idempotency_key' => 'The idempotency key may not be longer than 100 characters.',
            ]);
        }

        return $key;
    }

    private function findExisting(string $idempotencyKey): ?CompositionRun
    {
        return CompositionRun::query()
            ->with('items')
            ->where('idempotency_key', $idempotencyKey)
            ->first();
    }

    private function newRunNumber(): string
    {
        return 'RUN-'.strtoupper((string) Str::uuid());
    }
}
