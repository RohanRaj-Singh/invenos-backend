<?php

namespace App\Domains\Sales\Services;

use App\Domains\Composition\DTOs\CompositionItemOverrideData;
use App\Domains\Composition\DTOs\ExecuteCompositionData;
use App\Domains\Composition\Services\CompositionExecutionService;
use App\Domains\Composition\Services\CompositionQuantityMath;
use App\Domains\Inventory\Services\CostResolver;
use App\Domains\Inventory\Services\InventoryService;
use App\Domains\Ledger\CashLedgerService;
use App\Domains\Ledger\PartyBalance;
use App\Domains\Products\Services\ProductUnitService;
use App\Domains\Sales\DTOs\CreateSaleData;
use App\Models\Contact;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SellingUnit;
use App\Models\User;
use App\Services\Lifecycle\RecordLifecycleService;
use Illuminate\Database\QueryException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleService
{
    public function __construct(
        private readonly InventoryService $inventoryService,
        private readonly ProductUnitService $productUnitService,
        private readonly CompositionExecutionService $compositionExecution,
        private readonly CompositionQuantityMath $compositionQuantities,
    ) {}

    public function search(string $query = '', ?int $customerId = null, ?string $paymentStatus = null, string $dateFrom = '', string $dateTo = '', int $perPage = 25): LengthAwarePaginator
    {
        $q = Sale::with('customer')->withCount('items')->where('invoice_number', 'not like', 'RET-%');

        if ($query) {
            $raw = trim($query);
            $compact = preg_replace('/[^a-z0-9]/i', '', $raw);

            $q->where(function ($q) use ($raw, $compact) {
                $q->where('invoice_number', 'like', "%{$raw}%")
                    ->orWhere('customer_name', 'like', "%{$raw}%")
                    ->orWhere('payment_status', 'like', "%{$raw}%")
                    ->orWhere('source', 'like', "%{$raw}%")
                    ->orWhere('created_by', 'like', "%{$raw}%")
                    ->orWhere('date', 'like', "%{$raw}%")
                    ->orWhereRaw('CAST(subtotal AS CHAR) LIKE ?', ["%{$raw}%"])
                    ->orWhereRaw('CAST(discount AS CHAR) LIKE ?', ["%{$raw}%"])
                    ->orWhereRaw('CAST(grand_total AS CHAR) LIKE ?', ["%{$raw}%"])
                    ->orWhereRaw('CAST(amount_paid AS CHAR) LIKE ?', ["%{$raw}%"])
                    ->orWhereRaw('CAST(outstanding_balance AS CHAR) LIKE ?', ["%{$raw}%"]);

                // "INV 260831 2234" / "inv2608312234" both match INV-260831-2234
                if ($compact !== '') {
                    $q->orWhereRaw(
                        "REPLACE(REPLACE(REPLACE(invoice_number,'-',''),' ',''),'INV','') LIKE ?",
                        ["%{$compact}%"]
                    );
                }
            });
        }

        if ($customerId) {
            $q->where('customer_id', $customerId);
        }

        if ($paymentStatus && $paymentStatus !== 'all') {
            $q->where('payment_status', $paymentStatus);
        }

        if ($dateFrom) {
            $q->whereDate('date', '>=', $dateFrom);
        }

        if ($dateTo) {
            $q->whereDate('date', '<=', $dateTo);
        }

        return $q->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function create(CreateSaleData $data, bool $bypassStockCheck = false): Sale
    {
        if (empty($data->items)) {
            throw new \InvalidArgumentException('Sale must have at least one item.');
        }

        if ($data->idempotencyKey !== null) {
            $existing = $this->findIdempotentSale($data->idempotencyKey);
            if ($existing !== null) {
                return $existing;
            }
        }

        try {
            return DB::transaction(function () use ($data, $bypassStockCheck) {
                // Resolve customer — 0 means walk-in
                $customer = null;
                if ($data->customerId > 0) {
                    $customer = Contact::lockForUpdate()->findOrFail($data->customerId);
                    if (! in_array('customer', $customer->roles ?? [])) {
                        throw new \InvalidArgumentException('Contact must have the customer role.');
                    }
                }

                // Validate items before any creation
                foreach ($data->items as $itemData) {
                    if ($itemData->baseQuantity <= 0) {
                        throw new \InvalidArgumentException(
                            "Invalid quantity for product '{$itemData->productName}'."
                        );
                    }
                    if ($itemData->unitPrice < 0) {
                        throw new \InvalidArgumentException(
                            "Unit price cannot be negative for '{$itemData->productName}'."
                        );
                    }

                    // A line may be discounted down to zero, never above its own
                    // gross value. Without this a crafted request could inflate
                    // revenue or post a total unrelated to the quantity sold.
                    $lineGross = round($itemData->packagingQuantity * $itemData->unitPrice, 6);

                    if ($itemData->total < 0) {
                        throw ValidationException::withMessages([
                            'items' => "The line total for '{$itemData->productName}' cannot be negative.",
                        ]);
                    }

                    if ($lineGross + 0.01 < $itemData->total) {
                        throw ValidationException::withMessages([
                            'items' => "The line total for '{$itemData->productName}' exceeds its quantity × price.",
                        ]);
                    }
                }

                $subtotal = array_sum(array_map(fn ($item) => $item->total, $data->items));

                // A document discount settles against the subtotal. Over-discounting
                // would store a negative sale that reduces what the customer owes.
                if ($data->discount < 0 || $data->discount > $subtotal + 0.01) {
                    throw ValidationException::withMessages([
                        'discount' => 'The discount cannot exceed the sale subtotal.',
                    ]);
                }

                $grandTotal = round($subtotal - $data->discount, 2);
                $outstanding = max(0, $grandTotal - $data->amountPaid);

                // Settlement status is a fact about the money, not a client claim.
                $paymentStatus = match (true) {
                    $data->amountPaid >= $grandTotal => 'paid',
                    $data->amountPaid > 0 => 'partial',
                    default => 'unpaid',
                };

                $sale = Sale::create([
                    'invoice_number' => $data->invoiceNumber,
                    'idempotency_key' => $data->idempotencyKey,
                    'source' => $data->source,
                    'date' => $data->date,
                    'customer_id' => $data->customerId > 0 ? $data->customerId : null,
                    'customer_name' => $data->customerName ?: ($customer?->name ?? 'Walk-in Customer'),
                    'subtotal' => $subtotal,
                    'discount' => $data->discount,
                    'grand_total' => $grandTotal,
                    'amount_paid' => $data->amountPaid,
                    'outstanding_balance' => $outstanding,
                    'payment_status' => $paymentStatus,
                    'notes' => $data->notes,
                    'created_by' => $data->createdBy,
                ]);

                $deferredCompositions = [];
                $compositionRunsBySaleItem = [];

                foreach ($data->items as $itemData) {
                    $product = Product::withArchived()->lockForUpdate()->findOrFail($itemData->productId);

                    // Archived products are hidden from the POS picker; reject a crafted request too.
                    if ($product->isArchived()) {
                        throw ValidationException::withMessages([
                            'items' => "'{$product->name}' is archived and can't be added to a new sale.",
                        ]);
                    }

                    // Consumption products consume their components at sale time and
                    // do not move their own stock. Assembly/simple products keep the
                    // existing parent stock movement.
                    $consumptionComposition = ProductComposition::query()
                        ->where('product_id', $product->id)
                        ->where('kind', ProductComposition::KIND_CONSUMPTION)
                        ->where('is_active', true)
                        ->orderByDesc('version')
                        ->first();

                    if ($consumptionComposition === null
                        && ($itemData->formulaCompositionId !== null
                            || $itemData->formulaOverrides !== []
                            || $itemData->formulaOptionalItemIds !== [])) {
                        throw ValidationException::withMessages([
                            'items' => "Formula quantities were submitted for '{$product->name}', but it has no active formula.",
                        ]);
                    }

                    if ($consumptionComposition !== null
                        && $itemData->formulaCompositionId !== null
                        && (int) $consumptionComposition->id !== $itemData->formulaCompositionId) {
                        throw ValidationException::withMessages([
                            'items' => "The formula for '{$product->name}' changed after it was added to the cart. Review the formula and try again.",
                        ]);
                    }

                    // Server-side selling unit re-validation:
                    // When a selling_unit_id is provided, look up the authoritative
                    // conversion factor from the selling_units table instead of
                    // trusting the client-provided baseUnitQuantity.
                    $authoritativeBaseUnitQty = $itemData->baseUnitQuantity;
                    if ($consumptionComposition !== null) {
                        // Composition quantities must never come from the client.
                        // No selling unit means the line is expressed in base units.
                        $authoritativeBaseUnitQty = 1.0;
                    }
                    if ($itemData->sellingUnitId) {
                        $sellingUnit = SellingUnit::lockForUpdate()->find($itemData->sellingUnitId);
                        if ($sellingUnit && $sellingUnit->product_id === $product->id) {
                            $authoritativeBaseUnitQty = (float) $sellingUnit->quantity;
                        } elseif ($consumptionComposition !== null) {
                            throw ValidationException::withMessages([
                                'items' => "The selling unit for '{$product->name}' is invalid.",
                            ]);
                        }
                    }

                    $baseQty = $itemData->packagingQuantity * $authoritativeBaseUnitQty;
                    $formulaUnits = $consumptionComposition === null
                        ? 0.0
                        : $this->formulaUnitCount($consumptionComposition, $product, $baseQty);

                    // Uncosted stock is consumed first. The line keeps the known
                    // cost of the costed portion, but it is explicitly flagged
                    // incomplete instead of silently valuing uncosted units.
                    $uncostedConsumed = 0.0;
                    $costComplete = true;

                    if ($consumptionComposition === null) {
                        $uncostedAvailable = max(0, (float) $product->uncosted_qty);
                        $uncostedConsumed = min($baseQty, $uncostedAvailable);

                        if ($uncostedConsumed > 0) {
                            $product->uncosted_qty = max(0, $uncostedAvailable - $uncostedConsumed);
                            $product->save();
                        }
                    }

                    // Best available cost per base unit (average -> opening -> derived).
                    $unitCost = app(CostResolver::class)->unitCost($product);
                    $costPrice = $unitCost;

                    if ($uncostedConsumed > 0.000001) {
                        $costComplete = false;
                        $costedQuantity = max(0, $baseQty - $uncostedConsumed);
                        $knownCost = $unitCost === null ? 0.0 : $costedQuantity * $unitCost;
                        $costPrice = $knownCost > 0 && $baseQty > 0
                            ? round($knownCost / $baseQty, 6)
                            : null;
                    }

                    // Resolve the display unit name through ProductUnitService so raw
                    // unit_ids like 'kg' become 'Kilogram (kg)', and display names pass through.
                    $displayUnitName = $itemData->packagingName;
                    if (! $displayUnitName && $itemData->sellingUnitId) {
                        $su = SellingUnit::find($itemData->sellingUnitId);
                        $displayUnitName = $su?->name;
                    }
                    if (! $displayUnitName) {
                        $displayUnitName = $this->productUnitService->resolveDisplayUnit($product->base_unit_id);
                    } else {
                        $displayUnitName = $this->productUnitService->resolveDisplayUnit($displayUnitName);
                    }

                    $saleItem = SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $product->id,
                        'product_name' => $itemData->productName ?: $product->name,
                        'packaging_name' => $displayUnitName,
                        'packaging_quantity' => $itemData->packagingQuantity,
                        'base_unit_quantity' => $authoritativeBaseUnitQty,
                        'base_quantity' => $baseQty,
                        'unit_price' => $itemData->unitPrice,
                        'cost_price' => $costPrice,
                        'cost_complete' => $costComplete,
                        'uncosted_quantity' => round($uncostedConsumed, 6),
                        'total' => $itemData->total,
                        'discount_pct' => $itemData->discountPct,
                        'category' => $itemData->category ?: ($product->category?->name ?? ''),
                        'selling_unit_id' => $itemData->sellingUnitId,
                    ]);

                    if ($consumptionComposition !== null) {
                        $deferredCompositions[] = [
                            'composition' => $consumptionComposition,
                            'saleItem' => $saleItem,
                            'baseQuantity' => $baseQty,
                            'formulaUnits' => $formulaUnits,
                            'overrides' => $itemData->formulaOverrides,
                            'optionalItemIds' => $itemData->formulaOptionalItemIds,
                            'product' => $product,
                        ];

                        continue;
                    }

                    $this->inventoryService->recordSale(
                        productId: $product->id,
                        quantity: $baseQty,
                        packagingName: $itemData->packagingName,
                        packagingQuantity: $itemData->packagingQuantity,
                        reference: $data->invoiceNumber,
                        notes: 'Sale to '.($customer?->name ?? 'Walk-in Customer'),
                        user: $data->createdBy,
                        referenceId: $sale->id,
                        bypassStockCheck: $bypassStockCheck,
                        unitCost: $costPrice,
                        documentDate: $data->date,
                    );
                }

                // Execute consumption after every commercial line exists. Each call
                // joins this transaction; a later failure rolls back the sale, all
                // sale items, every earlier run, and every component movement.
                foreach ($deferredCompositions as $deferred) {
                    $composition = $deferred['composition'];
                    $saleItem = $deferred['saleItem'];
                    $product = $deferred['product'];
                    $overrides = $this->absoluteFormulaOverrides(
                        $deferred['overrides'],
                        (float) $deferred['formulaUnits'],
                    );

                    $run = $this->compositionExecution->executeWithinTransaction(
                        new ExecuteCompositionData(
                            compositionId: $composition->id,
                            quantity: $deferred['baseQuantity'],
                            quantityUnitId: $product->base_unit_id ?: 'piece',
                            sourceType: 'sale',
                            sourceId: $sale->id,
                            saleItemId: $saleItem->id,
                            reference: $data->invoiceNumber,
                            idempotencyKey: sprintf(
                                'sale:%d:item:%d:composition:%d',
                                $sale->id,
                                $saleItem->id,
                                $composition->id,
                            ),
                            createdBy: $data->createdBy,
                            userId: $data->userId,
                            location: $product->location,
                            documentDate: $data->date,
                            optionalItemIds: $deferred['optionalItemIds'],
                            overrides: $overrides,
                        ),
                    );

                    $compositionRunsBySaleItem[$saleItem->id][] = $run;
                }

                // Roll the immutable component snapshot into the sale item's
                // unit cost. Incomplete costs stay null; the canonical COGS
                // calculator still exposes known costs and completeness.
                foreach ($compositionRunsBySaleItem as $saleItemId => $runs) {
                    $saleItem = SaleItem::find($saleItemId);

                    if ($saleItem === null) {
                        continue;
                    }

                    $knownCost = 0.0;
                    $componentLines = 0;
                    $incomplete = false;

                    foreach ($runs as $run) {
                        foreach ($run->items as $line) {
                            $componentLines++;

                            if ($line->total_cost === null) {
                                $incomplete = true;
                            } else {
                                $knownCost += (float) $line->total_cost;
                            }
                        }
                    }

                    $complete = ! $incomplete && $componentLines > 0;

                    $saleItem->update([
                        'cost_price' => $complete && (float) $saleItem->base_quantity > 0
                            ? round($knownCost / (float) $saleItem->base_quantity, 6)
                            : null,
                        'cost_complete' => $complete,
                        'uncosted_quantity' => 0,
                    ]);
                }

                // Update customer balance: the invoice raises it, the initial
                // payment settles part of it. Both sides must be recorded.
                if ($customer) {
                    PartyBalance::apply($customer, $grandTotal);
                }

                $ledger = app(CashLedgerService::class);

                // Initial payment is a real cash receipt — including walk-ins,
                // which have no contact and were previously never recorded.
                if ((float) $data->amountPaid > 0) {
                    $ledger->record([
                        'contact_id' => $customer?->id,
                        'direction' => 'in',
                        'type' => 'collection',
                        'date' => $data->date,
                        'amount' => $data->amountPaid,
                        'method' => $data->paymentMethod ?: 'cash',
                        'reference' => 'RCPT-'.$data->invoiceNumber,
                        'description' => "Initial payment for {$data->invoiceNumber}",
                        'linked_sale_id' => $sale->id,
                        'source_type' => 'sale',
                        'source_id' => $sale->id,
                        'event_key' => 'sale-initial:'.$sale->id,
                        'created_by' => $data->createdBy,
                    ]);

                    if ($customer) {
                        PartyBalance::applyCash($customer, 'collection', (float) $data->amountPaid);
                    }
                }

                // Invoice memo — a credit document, not cash. Kept for backward
                // compatibility; every cash report excludes type='invoice'.
                if ($customer) {
                    $ledger->record([
                        'contact_id' => $customer->id,
                        'direction' => 'in',
                        'type' => 'invoice',
                        'date' => $data->date,
                        'amount' => $grandTotal,
                        'method' => $data->paymentMethod,
                        'reference' => $data->invoiceNumber,
                        'description' => "Sale: {$data->invoiceNumber}",
                        'linked_sale_id' => $sale->id,
                        'source_type' => 'sale',
                        'source_id' => $sale->id,
                        'event_key' => 'sale-invoice:'.$sale->id,
                        'created_by' => $data->createdBy,
                    ]);
                }

                return $sale->load('items', 'customer');
            }, 3);
        } catch (QueryException $e) {
            if ($data->idempotencyKey !== null && $this->isIdempotencyCollision($e)) {
                $existing = $this->findIdempotentSale($data->idempotencyKey);
                if ($existing !== null) {
                    return $existing;
                }
            }

            throw $e;
        }
    }

    private function formulaUnitCount(
        ProductComposition $composition,
        Product $product,
        float $baseQuantity,
    ): float {
        // Shared with the POS profitability preview so a preview can never scale
        // consumption differently from the sale it describes.
        return $this->compositionQuantities->formulaUnits($composition, $product, $baseQuantity);
    }

    /**
     * Convert formula-editor quantities (per formula unit) into the absolute
     * quantities expected by the execution engine.
     *
     * @param  CompositionItemOverrideData[]  $overrides
     * @return CompositionItemOverrideData[]
     */
    private function absoluteFormulaOverrides(array $overrides, float $formulaUnits): array
    {
        return $this->compositionQuantities->absoluteOverrides($overrides, $formulaUnits);
    }

    private function findIdempotentSale(string $key): ?Sale
    {
        $sale = Sale::withTrashed()->where('idempotency_key', $key)->first();

        if ($sale === null) {
            return null;
        }

        if ($sale->trashed()) {
            throw new \InvalidArgumentException('This idempotency key belongs to a deleted sale.');
        }

        return $sale->load('items', 'customer');
    }

    private function isIdempotencyCollision(QueryException $e): bool
    {
        $message = $e->getMessage();

        return ($e->errorInfo[1] ?? null) === 1062
            && (str_contains($message, 'sales_idempotency_key_unique')
                || str_contains($message, 'sales.idempotency_key'));
    }

    public function get(int $id): Sale
    {
        return Sale::with('items', 'customer', 'compositionRuns.items')->findOrFail($id);
    }

    /**
     * Deprecated — use RecordLifecycleService via SaleController::destroy().
     * This method now delegates to the lifecycle path for consistency.
     */
    public function delete(int $id): ?bool
    {
        $sale = Sale::findOrFail($id);
        app(RecordLifecycleService::class)->delete(
            $sale,
            request('reason', 'Deleted via service'),
            Auth::user() ?? User::first(),
        );

        return true;
    }

    public function restore(int $id): Sale
    {
        $sale = Sale::withTrashed()->findOrFail($id);
        $sale->restore();

        return $sale;
    }
}
