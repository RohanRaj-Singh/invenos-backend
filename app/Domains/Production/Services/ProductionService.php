<?php

namespace App\Domains\Production\Services;

use App\Domains\Composition\DTOs\ExecuteCompositionData;
use App\Domains\Composition\Services\CompositionExecutionService;
use App\Domains\Inventory\Services\InventoryService;
use App\Domains\Products\Services\ProductUnitService;
use App\Models\AuditLog;
use App\Models\CompositionRun;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\ProductionOrder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProductionService
{
    private const EPSILON = 0.000001;

    public function __construct(
        private readonly CompositionExecutionService $execution,
        private readonly InventoryService $inventory,
        private readonly ProductUnitService $units,
    ) {}

    public function create(array $data, ?string $createdBy = null): ProductionOrder
    {
        $product = Product::withArchived()->withTrashed()->findOrFail((int) $data['product_id']);
        $composition = ProductComposition::with('items')->findOrFail((int) $data['composition_id']);
        $plannedQuantity = (float) ($data['planned_quantity'] ?? 0);
        $outputUnitId = $data['output_unit_id'] ?? $composition->output_unit_id ?? $product->base_unit_id;

        $this->validateOrderable($product, $composition, $plannedQuantity, (string) $outputUnitId);

        return DB::transaction(fn () => ProductionOrder::create([
            'production_number' => $this->nextProductionNumber(),
            'product_id' => $product->id,
            'composition_id' => $composition->id,
            'composition_version' => $composition->version,
            'planned_quantity' => $plannedQuantity,
            'output_unit_id' => $outputUnitId,
            'location' => $data['location'] ?? $product->location,
            'status' => ProductionOrder::STATUS_DRAFT,
            'planned_date' => $data['planned_date'] ?? now()->format('Y-m-d'),
            'created_by' => $createdBy,
            'reference' => $data['reference'] ?? null,
            'notes' => $data['notes'] ?? null,
        ])->fresh(['product', 'composition']));
    }

    public function updateDraft(ProductionOrder $order, array $data, ?string $createdBy = null): ProductionOrder
    {
        return DB::transaction(function () use ($order, $data): ProductionOrder {
            $order = ProductionOrder::lockForUpdate()->findOrFail($order->id);

            if ($order->status !== ProductionOrder::STATUS_DRAFT) {
                throw ValidationException::withMessages([
                    'status' => 'Only draft production orders can be edited.',
                ]);
            }

            $product = Product::withArchived()->withTrashed()->findOrFail((int) ($data['product_id'] ?? $order->product_id));
            $composition = ProductComposition::with('items')->findOrFail((int) ($data['composition_id'] ?? $order->composition_id));
            $plannedQuantity = (float) ($data['planned_quantity'] ?? $order->planned_quantity);
            $outputUnitId = $data['output_unit_id'] ?? $order->output_unit_id;

            $this->validateOrderable($product, $composition, $plannedQuantity, (string) $outputUnitId);

            $order->update([
                'product_id' => $product->id,
                'composition_id' => $composition->id,
                'composition_version' => $composition->version,
                'planned_quantity' => $plannedQuantity,
                'output_unit_id' => $outputUnitId,
                'location' => $data['location'] ?? $order->location,
                'planned_date' => $data['planned_date'] ?? $order->planned_date,
                'reference' => $data['reference'] ?? $order->reference,
                'notes' => $data['notes'] ?? $order->notes,
            ]);

            return $order->fresh(['product', 'composition']);
        });
    }

    public function start(ProductionOrder $order): ProductionOrder
    {
        return DB::transaction(function () use ($order): ProductionOrder {
            $order = ProductionOrder::lockForUpdate()->findOrFail($order->id);

            if ($order->status === ProductionOrder::STATUS_IN_PROGRESS) {
                return $order->fresh(['product', 'composition']);
            }

            if ($order->status !== ProductionOrder::STATUS_DRAFT) {
                throw ValidationException::withMessages([
                    'status' => 'Only draft production orders can be started.',
                ]);
            }

            $order->update([
                'status' => ProductionOrder::STATUS_IN_PROGRESS,
                'started_at' => now(),
            ]);

            return $order->fresh(['product', 'composition']);
        });
    }

    public function cancel(ProductionOrder $order): ProductionOrder
    {
        return DB::transaction(function () use ($order): ProductionOrder {
            $order = ProductionOrder::lockForUpdate()->findOrFail($order->id);

            if (! in_array($order->status, [ProductionOrder::STATUS_DRAFT, ProductionOrder::STATUS_IN_PROGRESS], true)) {
                throw ValidationException::withMessages([
                    'status' => 'Only draft or in-progress production orders can be cancelled.',
                ]);
            }

            $order->update(['status' => ProductionOrder::STATUS_CANCELLED]);

            return $order->fresh(['product', 'composition']);
        });
    }

    public function execute(
        ProductionOrder $order,
        float $actualOutputQuantity,
        ?string $outputUnitId = null,
        ?string $idempotencyKey = null,
        ?string $userName = null,
        ?int $userId = null,
        ?string $documentDate = null,
        ?string $location = null,
    ): ProductionOrder {
        if ($actualOutputQuantity <= 0) {
            throw ValidationException::withMessages([
                'actual_output_quantity' => 'Actual output quantity must be greater than zero.',
            ]);
        }

        $idempotencyKey = $this->normalizeKey($idempotencyKey);

        if ($idempotencyKey !== null) {
            $existing = $this->findByExecutionKey($idempotencyKey);

            if ($existing !== null) {
                if ($existing->id === $order->id) {
                    return $existing->load($this->relations());
                }

                throw ValidationException::withMessages([
                    'idempotency_key' => 'This idempotency key belongs to another production order.',
                ]);
            }
        }

        try {
            return DB::transaction(function () use (
                $order,
                $actualOutputQuantity,
                $outputUnitId,
                $idempotencyKey,
                $userName,
                $userId,
                $documentDate,
                $location,
            ): ProductionOrder {
                $order = ProductionOrder::lockForUpdate()->findOrFail($order->id);

                if ($idempotencyKey !== null && $order->idempotency_key === $idempotencyKey) {
                    if ($order->status === ProductionOrder::STATUS_COMPLETED) {
                        return $order->load($this->relations());
                    }
                }

                if (! in_array($order->status, [
                    ProductionOrder::STATUS_DRAFT,
                    ProductionOrder::STATUS_IN_PROGRESS,
                ], true)) {
                    throw ValidationException::withMessages([
                        'status' => 'Only draft or in-progress production orders can be executed.',
                    ]);
                }

                $product = Product::withArchived()->withTrashed()->findOrFail($order->product_id);
                $composition = ProductComposition::with('items')->findOrFail($order->composition_id);
                $unitId = $outputUnitId ?: $order->output_unit_id;
                $executionLocation = $location ?: $order->location ?: $product->location;

                $this->validateOrderable($product, $composition, $actualOutputQuantity, $unitId);

                if ((int) $composition->version !== (int) $order->composition_version) {
                    throw ValidationException::withMessages([
                        'composition_id' => 'The selected composition version is no longer active. Update the draft order.',
                    ]);
                }

                $run = $this->execution->executeWithinTransaction(
                    new ExecuteCompositionData(
                        compositionId: $composition->id,
                        quantity: $actualOutputQuantity,
                        quantityUnitId: $unitId,
                        sourceType: 'production',
                        sourceId: $order->id,
                        reference: $order->production_number,
                        idempotencyKey: 'production:'.$order->id.':execute',
                        createdBy: $userName ?: $order->created_by,
                        userId: $userId,
                        location: $executionLocation,
                        documentDate: $documentDate ?: ($order->planned_date?->format('Y-m-d') ?? now()->format('Y-m-d')),
                    ),
                    ProductComposition::KIND_ASSEMBLY,
                );

                $actualBaseQuantity = (float) $run->output_quantity;

                if ($actualBaseQuantity <= 0) {
                    throw ValidationException::withMessages([
                        'actual_output_quantity' => 'The converted output quantity must be greater than zero.',
                    ]);
                }

                [$knownCost, $costComplete, $unitCost] = $this->runCost($run, $actualBaseQuantity);

                $this->applyFinishedGoodsCost($order->product_id, $actualBaseQuantity, $unitCost, $costComplete);

                $movement = $this->inventory->recordProduction(
                    productId: $order->product_id,
                    quantity: $actualBaseQuantity,
                    reference: $order->production_number,
                    notes: 'Production receipt - '.$order->production_number,
                    user: $userName ?: $order->created_by,
                    referenceId: $order->id,
                    unitCost: $unitCost,
                    documentDate: $documentDate ?: now()->format('Y-m-d'),
                );

                $order->update([
                    'status' => ProductionOrder::STATUS_COMPLETED,
                    'actual_output_quantity' => $actualOutputQuantity,
                    'actual_output_base_quantity' => $actualBaseQuantity,
                    'output_unit_id' => $unitId,
                    'location' => $executionLocation,
                    'started_at' => $order->started_at ?: now(),
                    'completed_at' => now(),
                    'completed_by' => $userName ?: $order->created_by,
                    'composition_run_id' => $run->id,
                    'total_cost' => $knownCost,
                    'unit_cost' => $unitCost,
                    'cost_basis' => $run->cost_basis,
                    'cost_complete' => $costComplete,
                    'finished_inventory_transaction_id' => $movement->id,
                    'idempotency_key' => $idempotencyKey,
                ]);

                AuditLog::create([
                    'user_id' => $userId,
                    'event' => 'production.completed',
                    'auditable_type' => ProductionOrder::class,
                    'auditable_id' => $order->id,
                    'description' => sprintf(
                        'Production %s completed: %s %s of %s',
                        $order->production_number,
                        $actualOutputQuantity,
                        $unitId,
                        $product->name,
                    ),
                    'reason' => $order->reference,
                    'ip_address' => app()->runningInConsole() ? null : request()->ip(),
                ]);

                return $order->fresh($this->relations());
            });
        } catch (QueryException $exception) {
            if ($idempotencyKey !== null) {
                $existing = $this->findByExecutionKey($idempotencyKey);

                if ($existing !== null && $existing->id === $order->id) {
                    return $existing->load($this->relations());
                }
            }

            throw $exception;
        }
    }

    public function reverse(
        ProductionOrder $order,
        ?string $idempotencyKey = null,
        ?string $userName = null,
        ?int $userId = null,
    ): ProductionOrder {
        $idempotencyKey = $this->normalizeKey($idempotencyKey);

        if ($idempotencyKey !== null) {
            $existing = ProductionOrder::query()
                ->where('reversal_idempotency_key', $idempotencyKey)
                ->first();

            if ($existing !== null) {
                if ($existing->id === $order->id) {
                    return $existing->load($this->relations());
                }

                throw ValidationException::withMessages([
                    'idempotency_key' => 'This reversal key belongs to another production order.',
                ]);
            }
        }

        return DB::transaction(function () use ($order, $idempotencyKey, $userName, $userId): ProductionOrder {
            $order = ProductionOrder::lockForUpdate()->findOrFail($order->id);

            if ($order->status === ProductionOrder::STATUS_REVERSED) {
                return $order->load($this->relations());
            }

            if ($order->status !== ProductionOrder::STATUS_COMPLETED) {
                throw ValidationException::withMessages([
                    'status' => 'Only completed production orders can be reversed.',
                ]);
            }

            $product = Product::withArchived()->lockForUpdate()->findOrFail($order->product_id);
            $quantity = (float) $order->actual_output_base_quantity;
            $stockBefore = (float) $product->stock_quantity;
            $uncostedBefore = max(0, (float) $product->uncosted_qty);
            $averageBefore = $product->average_cost === null ? null : (float) $product->average_cost;

            if ($quantity <= 0) {
                throw ValidationException::withMessages([
                    'status' => 'Production has no recorded output quantity.',
                ]);
            }

            if ($stockBefore + self::EPSILON < $quantity) {
                throw ValidationException::withMessages([
                    'status' => sprintf(
                        'Cannot reverse production: only %s of %s base units remain in stock; %s were produced.',
                        $product->stock_quantity,
                        $product->base_unit_id,
                        $quantity,
                    ),
                ]);
            }

            $movement = $this->inventory->recordProduction(
                productId: $order->product_id,
                quantity: -$quantity,
                reference: 'REV-'.$order->production_number,
                notes: 'Production reversal - '.$order->production_number,
                user: $userName,
                referenceId: $order->id,
                unitCost: $order->cost_complete ? $order->unit_cost : null,
                documentDate: now()->format('Y-m-d'),
            );

            $product->refresh();

            $this->applyFinishedGoodsReversalCost(
                $product,
                $stockBefore,
                $uncostedBefore,
                $averageBefore,
                $quantity,
                (bool) $order->cost_complete,
                $order->unit_cost === null ? null : (float) $order->unit_cost,
            );

            $order->update([
                'status' => ProductionOrder::STATUS_REVERSED,
                'reversed_at' => now(),
                'reversed_by' => $userName,
                'reversal_inventory_transaction_id' => $movement->id,
                'reversal_idempotency_key' => $idempotencyKey,
            ]);

            AuditLog::create([
                'user_id' => $userId,
                'event' => 'production.reversed',
                'auditable_type' => ProductionOrder::class,
                'auditable_id' => $order->id,
                'description' => 'Production '.$order->production_number.' reversed; components were not restored.',
                'reason' => null,
                'ip_address' => app()->runningInConsole() ? null : request()->ip(),
            ]);

            return $order->fresh($this->relations());
        });
    }

    /**
     * @return array{0: float, 1: bool, 2: float|null}
     */
    private function runCost(CompositionRun $run, float $outputBaseQuantity): array
    {
        $run->loadMissing('items');
        $known = 0.0;
        $lines = 0;
        $incomplete = false;

        foreach ($run->items as $line) {
            $lines++;

            if ($line->total_cost === null) {
                $incomplete = true;
            } else {
                $known += (float) $line->total_cost;
            }
        }

        $complete = ! $incomplete && $lines > 0;
        $unitCost = $complete && $outputBaseQuantity > 0
            ? round($known / $outputBaseQuantity, 6)
            : null;

        return [round($known, 6), $complete, $unitCost];
    }

    private function applyFinishedGoodsCost(
        int $productId,
        float $incomingQuantity,
        ?float $unitCost,
        bool $costComplete,
    ): void {
        $product = Product::withArchived()->lockForUpdate()->findOrFail($productId);

        if (! $costComplete || $unitCost === null) {
            // Incomplete production cost must not enter the moving average.
            $product->uncosted_qty = (float) $product->uncosted_qty + $incomingQuantity;
            $product->save();

            return;
        }

        $qtyOnHand = (float) $product->stock_quantity;
        $uncosted = (float) ($product->uncosted_qty ?? 0);
        $oldAverage = $product->average_cost ?? $product->opening_cost;

        if ($oldAverage === null) {
            if ($qtyOnHand > 0) {
                $uncosted += $qtyOnHand;
            }

            $product->uncosted_qty = $uncosted;
            $product->average_cost = $unitCost;
        } else {
            $costedQuantity = max(0, $qtyOnHand - $uncosted);
            $denominator = $costedQuantity + $incomingQuantity;

            $product->average_cost = $denominator > 0
                ? (($costedQuantity * $oldAverage) + ($incomingQuantity * $unitCost)) / $denominator
                : $unitCost;
        }

        $product->save();
    }

    /**
     * Re-base the finished product's weighted average after removing a
     * production receipt. The receipt is removed at its original unit cost;
     * remaining costed quantity keeps the remaining book value.
     */
    private function applyFinishedGoodsReversalCost(
        Product $product,
        float $stockBefore,
        float $uncostedBefore,
        ?float $averageBefore,
        float $quantity,
        bool $costComplete,
        ?float $unitCost,
    ): void {
        $remainingStock = max(0, $stockBefore - $quantity);
        $remainingUncosted = min($uncostedBefore, $remainingStock);

        if (! $costComplete || $unitCost === null) {
            $product->uncosted_qty = $remainingUncosted;
            $product->save();

            return;
        }

        $costedBefore = max(0, $stockBefore - $uncostedBefore);
        $remainingCosted = max(0, $costedBefore - $quantity);
        $average = $averageBefore ?? $unitCost;
        $valueBefore = $costedBefore * $average;
        $valueRemoved = min($valueBefore, $quantity * $unitCost);
        $remainingValue = max(0, $valueBefore - $valueRemoved);

        $product->uncosted_qty = $remainingUncosted;
        $product->average_cost = $remainingCosted > 0
            ? round($remainingValue / $remainingCosted, 6)
            : null;
        $product->save();
    }

    private function validateOrderable(
        Product $product,
        ProductComposition $composition,
        float $quantity,
        string $outputUnitId,
    ): void {
        if ($product->archived_at !== null || $product->trashed()) {
            throw ValidationException::withMessages([
                'product_id' => 'The production product must exist and be active.',
            ]);
        }

        if (! $product->track_inventory) {
            throw ValidationException::withMessages([
                'product_id' => 'The finished product must track inventory.',
            ]);
        }

        if (! $composition->is_active || $composition->kind !== ProductComposition::KIND_ASSEMBLY) {
            throw ValidationException::withMessages([
                'composition_id' => 'Production requires an active assembly composition.',
            ]);
        }

        if ((int) $composition->product_id !== (int) $product->id) {
            throw ValidationException::withMessages([
                'composition_id' => 'The composition does not belong to the selected product.',
            ]);
        }

        if ($quantity <= 0) {
            throw ValidationException::withMessages([
                'planned_quantity' => 'Planned quantity must be greater than zero.',
            ]);
        }

        if ($this->units->convert($quantity, $outputUnitId, $product->base_unit_id ?: 'piece') === null) {
            throw ValidationException::withMessages([
                'output_unit_id' => 'The output unit is not compatible with the product base unit.',
            ]);
        }
    }

    /**
     * @return array<int, string>
     */
    private function relations(): array
    {
        return ['product', 'composition', 'compositionRun.items', 'finishedInventoryTransaction'];
    }

    private function normalizeKey(?string $key): ?string
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

    private function findByExecutionKey(string $key): ?ProductionOrder
    {
        return ProductionOrder::query()->where('idempotency_key', $key)->first();
    }

    private function nextProductionNumber(): string
    {
        do {
            $number = 'PROD-'.now()->format('ymd').'-'.strtoupper(Str::random(6));
        } while (ProductionOrder::query()->where('production_number', $number)->exists());

        return $number;
    }
}
