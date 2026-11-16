<?php

namespace App\Domains\Returns\Services;

use App\Domains\Composition\Services\CompositionReturnRecoveryService;
use App\Domains\Inventory\Services\CostResolver;
use App\Domains\Inventory\Services\InventoryService;
use App\Domains\Ledger\CashLedgerService;
use App\Domains\Ledger\PartyBalance;
use App\Domains\Returns\DTOs\ReturnCreateData;
use App\Models\AuditLog;
use App\Models\Contact;
use App\Models\FinancialTransaction;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\PurchaseBill;
use App\Models\PurchaseBillItem;
use App\Models\ReturnModel;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Database\QueryException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Canonical return service.
 *
 * Lifecycle: pending → completed → (reversed) | pending → cancelled.
 *
 * Effects are applied once, inside one transaction, and are reversed by
 * compensating records — never by deleting history.
 */
class ReturnService
{
    public function __construct(
        private readonly InventoryService $inventory,
        private readonly CashLedgerService $ledger,
        private readonly CompositionReturnRecoveryService $compositionRecoveries,
    ) {}

    // ─── Return Number Generation ───────────────────────────────

    public function generateReturnNumber(string $type): string
    {
        $prefix = $type === 'SALE' ? 'SR-' : 'PR-';
        $count = DB::table('returns')
            ->where('return_number', 'like', $prefix.'%')
            ->count() + 1;
        $number = $prefix.str_pad((string) $count, 5, '0', STR_PAD_LEFT);

        while (DB::table('returns')->where('return_number', $number)->exists()) {
            $count++;
            $number = $prefix.str_pad((string) $count, 5, '0', STR_PAD_LEFT);
        }

        return $number;
    }

    // ─── Validation ────────────────────────────────────────────

    /**
     * @throws \InvalidArgumentException
     */
    public function validate(ReturnCreateData $data): void
    {
        if (empty($data->items)) {
            throw new \InvalidArgumentException('Return must have at least one item.');
        }

        if ($data->refundAmount < 0 || $data->refundAmount > $data->grandTotal) {
            throw new \InvalidArgumentException('Refund amount must be between 0 and the return value.');
        }

        if ($data->grandTotal < 0) {
            throw new \InvalidArgumentException('Return value cannot be negative.');
        }

        // A return is a value refund against a document, so it can never exceed
        // what that document still has left to return. Without this bound a
        // crafted request could credit a customer more than the original sale.
        //
        // Like the quantity check, this uses completed returns only: several
        // pending returns may be drafted against one document, and completion
        // re-validates the real total.
        $documentValue = $data->type === 'SALE'
            ? (float) Sale::query()->whereKey($data->referenceId)->value('grand_total')
            : (float) PurchaseBill::query()->whereKey($data->referenceId)->value('total_amount');

        $alreadyReturned = (float) ReturnModel::query()
            ->where('reference_type', $data->type === 'SALE' ? 'sale' : 'purchase_bill')
            ->where('reference_id', $data->referenceId)
            ->where('status', 'completed')
            ->sum('grand_total');

        $remainingValue = round($documentValue - $alreadyReturned, 2);

        if ($data->grandTotal > $remainingValue + 0.01) {
            throw new \InvalidArgumentException(
                "The return value cannot exceed the {$remainingValue} still returnable on this document."
            );
        }

        if (! $this->referenceExists($data)) {
            throw ValidationException::withMessages([
                'reference_id' => 'The original document for this return does not exist.',
            ]);
        }

        foreach ($data->items as $item) {
            $originalItem = $this->findOriginalItem($data->referenceType, $item->referenceItemId);
            if (! $originalItem) {
                throw new \InvalidArgumentException("Original line item #{$item->referenceItemId} not found.");
            }

            // Ownership: the referenced line must belong to the referenced
            // document. Without this, a crafted request could return another
            // sale's line and refund against the wrong invoice.
            $this->assertItemBelongsToReference($originalItem, $data);

            $originalQty = (float) ($originalItem['quantity'] ?? 0);
            $previouslyReturned = ReturnModel::returnedQuantityForItem(
                $item->referenceItemType,
                $item->referenceItemId,
            );
            $remainingQty = $originalQty - $previouslyReturned;

            if ($item->quantity <= 0) {
                throw new \InvalidArgumentException("Invalid return quantity for '{$item->productName}'.");
            }

            if ($item->quantity > $remainingQty) {
                throw new \InvalidArgumentException(
                    "Cannot return {$item->quantity} of '{$item->productName}'. ".
                    "Only {$remainingQty} remaining (original: {$originalQty}, already returned: {$previouslyReturned})."
                );
            }

            if ($item->baseQuantity <= 0) {
                throw new \InvalidArgumentException("Invalid base quantity for '{$item->productName}'.");
            }

            if ($item->unitPrice < 0) {
                throw new \InvalidArgumentException("Unit price cannot be negative for '{$item->productName}'.");
            }

            // Material recovery is validated here for fast feedback, and again
            // when the return completes. Nothing is trusted from the client
            // except the run-item id and the verified quantity.
            if ($item->recoveries() !== []) {
                $this->compositionRecoveries->resolveDeclaredRecoveries(
                    $item,
                    $this->saleItemOrFail($originalItem),
                );
            }
        }
    }

    private function referenceExists(ReturnCreateData $data): bool
    {
        return match (true) {
            $data->type === 'SALE' => Sale::query()
                ->whereKey($data->referenceId)
                ->exists(),
            default => PurchaseBill::query()
                ->whereKey($data->referenceId)
                ->exists(),
        };
    }

    /**
     * @param  array<string, mixed>  $originalItem
     */
    private function assertItemBelongsToReference(array $originalItem, ReturnCreateData $data): void
    {
        $ownerKey = $data->type === 'SALE' ? 'sale_id' : 'purchase_bill_id';
        $ownerId = $originalItem[$ownerKey] ?? null;

        if ($ownerId === null || (int) $ownerId !== $data->referenceId) {
            throw ValidationException::withMessages([
                'items' => 'A returned line does not belong to the referenced document.',
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $originalItem
     */
    private function saleItemOrFail(array $originalItem): SaleItem
    {
        $saleItem = SaleItem::find($originalItem['id'] ?? 0);

        if ($saleItem === null) {
            throw ValidationException::withMessages([
                'items' => 'Recovered material can only be declared for a sale line.',
            ]);
        }

        return $saleItem;
    }

    // ─── Preview ───────────────────────────────────────────────

    public function preview(ReturnCreateData $data): array
    {
        $isSaleReturn = $data->type === 'SALE';
        $contact = $data->contactId ? Contact::find($data->contactId) : null;

        $inventoryItems = [];
        foreach ($data->items as $item) {
            $product = Product::withArchived()->find($item->productId);
            $qty = $isSaleReturn ? $item->baseQuantity : -$item->baseQuantity;
            $inventoryItems[] = [
                'product' => $product?->name ?? $item->productName,
                'quantity' => $qty,
                'unit' => $item->packagingName ?? 'units',
                'restock' => $item->restock,
            ];
        }

        return [
            'type' => $isSaleReturn ? 'Sale Return' : 'Purchase Return',
            'document_number' => $data->returnNumber,
            'inventory' => $inventoryItems,
            'financial' => [
                'subtotal' => $data->subtotal,
                'discount' => $data->discount,
                'grand_total' => $data->grandTotal,
                'refund_amount' => $data->refundAmount,
                'credit_amount' => round($data->grandTotal - $data->refundAmount, 2),
                'method' => $data->refundMethod,
            ],
            'balance' => $contact ? [
                'contact_name' => $contact->name,
                'current_balance' => (float) $contact->current_balance,
                'change' => -$data->grandTotal,
            ] : null,
        ];
    }

    // ─── Create Return (Pending) ───────────────────────────────

    public function createReturn(ReturnCreateData $data): ReturnModel
    {
        if ($data->idempotencyKey !== null) {
            $existing = $this->findByIdempotencyKey($data->idempotencyKey);

            if ($existing !== null) {
                return $existing;
            }
        }

        $this->validate($data);

        try {
            return DB::transaction(fn () => $this->persistReturn($data));
        } catch (QueryException $exception) {
            // A concurrent duplicate may have claimed the idempotency key while
            // this request was validating. Return the winner instead of failing.
            if ($data->idempotencyKey !== null) {
                $existing = $this->findByIdempotencyKey($data->idempotencyKey);

                if ($existing !== null) {
                    return $existing;
                }
            }

            throw $exception;
        }
    }

    private function findByIdempotencyKey(string $key): ?ReturnModel
    {
        return ReturnModel::with('items', 'contact', 'reason')
            ->where('idempotency_key', $key)
            ->first();
    }

    private function persistReturn(ReturnCreateData $data): ReturnModel
    {
        $return = ReturnModel::create([
            'return_number' => $data->returnNumber ?: $this->generateReturnNumber($data->type),
            'idempotency_key' => $data->idempotencyKey,
            'type' => $data->type,
            'reference_type' => $data->referenceType,
            'reference_id' => $data->referenceId,
            'contact_id' => $data->contactId ?: null,
            'return_date' => $data->returnDate,
            'reason_id' => $data->reasonId,
            'reason_note' => $data->reasonNote,
            'status' => 'pending',
            'subtotal' => $data->subtotal,
            'discount' => $data->discount,
            'grand_total' => $data->grandTotal,
            'refund_amount' => $data->refundAmount,
            'refund_method' => $data->refundMethod,
            'notes' => $data->notes,
            'created_by' => $data->createdBy,
        ]);

        foreach ($data->items as $item) {
            $returnItem = $return->items()->create([
                'reference_item_type' => $item->referenceItemType,
                'reference_item_id' => $item->referenceItemId,
                'product_id' => $item->productId,
                'product_name' => $item->productName,
                'selling_unit_id' => $item->sellingUnitId,
                'packaging_name' => $item->packagingName,
                'quantity' => $item->quantity,
                'base_quantity' => $item->baseQuantity,
                'unit_price' => $item->unitPrice,
                'total' => $item->total,
                'restock' => $item->restock,
                'reason_id' => $item->reasonId,
                'notes' => $item->notes,
            ]);

            if ($item->recoveries() !== []) {
                $resolved = $this->compositionRecoveries->resolveDeclaredRecoveries(
                    $item,
                    $this->saleItemOrFail(['id' => $item->referenceItemId]),
                );

                $this->compositionRecoveries->declare($return, $returnItem, $resolved);
            }
        }

        return $return->load('items', 'contact', 'reason');
    }

    // ─── Complete Return (Apply Effects Once) ──────────────────

    public function completeReturn(int $id): ReturnModel
    {
        return DB::transaction(function () use ($id) {
            $return = ReturnModel::with('items')->lockForUpdate()->findOrFail($id);

            if ($return->status !== 'pending') {
                throw new \InvalidArgumentException(
                    "Cannot complete return #{$id}: status is '{$return->status}', expected 'pending'."
                );
            }

            if ($return->effects_applied_at !== null) {
                throw new \InvalidArgumentException("Return #{$id} has already been applied.");
            }

            if ($return->items->isEmpty()) {
                throw new \InvalidArgumentException("Cannot complete return #{$id}: no items.");
            }

            // Two pending returns for the same line can both pass creation-time
            // validation. Whichever completes second must still fit inside the
            // sold quantity and the document value.
            $this->assertQuantitiesStillReturnable($return);
            $this->assertValueStillReturnable($return);

            $isSaleReturn = $return->type === 'SALE';
            $contact = $return->contact_id ? Contact::lockForUpdate()->find($return->contact_id) : null;
            $date = $return->return_date?->format('Y-m-d') ?? now()->toDateString();

            // 1. Stock
            foreach ($return->items as $item) {
                $this->applyStock($return, $item, $isSaleReturn);
            }

            // 1b. Recovered material. Explicit and separate from the refund:
            // components are restored only where a verified quantity was
            // declared, and never from the commercial restock flag.
            if ($isSaleReturn) {
                $this->restoreRecoveredMaterial($return);
            }

            // 2. Party: the credit note reduces the balance by the return value.
            if ($contact) {
                PartyBalance::apply($contact, -(float) $return->grand_total);
            }

            // 3. Cash: only the actual refund moves money.
            $refund = (float) $return->refund_amount;
            if ($refund > 0) {
                $this->ledger->record([
                    'contact_id' => $contact?->id,
                    'direction' => $isSaleReturn ? 'out' : 'in',
                    'type' => 'refund',
                    'date' => $date,
                    'amount' => $refund,
                    'method' => $return->refund_method ?: 'cash',
                    'reference' => $return->return_number,
                    'description' => ($isSaleReturn ? 'Refund for ' : 'Refund from supplier for ').$return->return_number,
                    'linked_sale_id' => $isSaleReturn ? $return->reference_id : null,
                    'linked_purchase_id' => $isSaleReturn ? null : $return->reference_id,
                    'linked_return_id' => $return->id,
                    'source_type' => 'return',
                    'source_id' => $return->id,
                    'event_key' => 'refund:'.$return->id.':'.$return->return_number,
                    'created_by' => $return->created_by,
                ]);

                if ($contact) {
                    PartyBalance::applyCash($contact, 'refund', $refund);
                }
            }

            // 4. Original document tracking
            $this->applyReturnToOriginal($return, 1);

            $return->status = 'completed';
            $return->effects_applied_at = now();
            $return->save();

            return $return->fresh()->load('items', 'contact', 'reason', 'reference');
        });
    }

    // ─── Reverse a Completed Return ────────────────────────────

    public function reverseReturn(int $id, ?string $user = null): ReturnModel
    {
        return DB::transaction(function () use ($id, $user) {
            $return = ReturnModel::with('items')->lockForUpdate()->findOrFail($id);

            if ($return->status !== 'completed') {
                throw new \InvalidArgumentException(
                    "Cannot reverse return #{$id}: status is '{$return->status}', expected 'completed'."
                );
            }

            $isSaleReturn = $return->type === 'SALE';
            $contact = $return->contact_id ? Contact::lockForUpdate()->find($return->contact_id) : null;

            // 1. Reverse every stock movement this return produced.
            $movements = InventoryTransaction::where('reference', $return->return_number)
                ->whereIn('type', ['sale-return', 'purchase-return', 'damage'])
                ->get();

            foreach ($movements as $movement) {
                $this->inventory->recordAdjustment(
                    productId: (int) $movement->product_id,
                    quantity: -(float) $movement->quantity,
                    type: $movement->type,
                    reference: 'REV-'.$return->return_number,
                    notes: 'Reversal of return '.$return->return_number,
                    referenceType: 'return',
                    referenceId: $return->id,
                    user: $user ?? 'System',
                );
            }

            // 2. Reverse refunds.
            $refunds = FinancialTransaction::where('linked_return_id', $return->id)
                ->where('type', 'refund')
                ->whereNull('reversed_at')
                ->get();

            foreach ($refunds as $refund) {
                if ($contact) {
                    PartyBalance::reverseCash($contact, 'refund', (float) $refund->amount);
                }
                $this->ledger->reverse($refund, 'Return reversed', $user);
            }

            // 3. Undo the credit note.
            if ($contact) {
                PartyBalance::apply($contact, (float) $return->grand_total);
            }

            // 4. Restore the original document's return tracking.
            $this->applyReturnToOriginal($return, -1);

            $return->status = 'reversed';
            $return->save();

            return $return->fresh()->load('items', 'contact', 'reason', 'reference');
        });
    }

    // ─── Cancel Return ──────────────────────────────────────────

    public function cancelReturn(int $id): ReturnModel
    {
        $return = ReturnModel::findOrFail($id);

        if ($return->status !== 'pending') {
            throw new \InvalidArgumentException(
                "Cannot cancel return #{$return->id}: status is '{$return->status}', expected 'pending'."
            );
        }

        $return->status = 'cancelled';
        $return->save();

        return $return->fresh();
    }

    // ─── Query ──────────────────────────────────────────────────

    public function get(int $id): ReturnModel
    {
        return ReturnModel::withTrashed()
            ->with(['items.product', 'contact', 'reason', 'reference'])
            ->findOrFail($id);
    }

    public function search(
        string $query = '',
        ?string $type = null,
        ?string $status = null,
        string $dateFrom = '',
        string $dateTo = '',
        int $perPage = 25,
    ): LengthAwarePaginator {
        $q = ReturnModel::withTrashed()->with(['contact', 'reason']);

        if ($type && in_array($type, ['SALE', 'PURCHASE'], true)) {
            $q->where('type', $type);
        }

        if ($status && in_array($status, ['pending', 'completed', 'cancelled', 'reversed'], true)) {
            $q->where('status', $status);
        }

        if ($query) {
            $q->where(function ($q) use ($query) {
                $q->where('return_number', 'like', "%{$query}%")
                    ->orWhereHas('contact', fn ($cq) => $cq->where('name', 'like', "%{$query}%"));
            });
        }

        if ($dateFrom) {
            $q->whereDate('return_date', '>=', $dateFrom);
        }

        if ($dateTo) {
            $q->whereDate('return_date', '<=', $dateTo);
        }

        return $q->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function forOriginal(string $referenceType, int $referenceId): array
    {
        return ReturnModel::with(['items.product', 'contact', 'reason'])
            ->where('reference_type', $referenceType)
            ->where('reference_id', $referenceId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    // ─── Helpers ───────────────────────────────────────────────

    private function applyStock(ReturnModel $return, $item, bool $isSaleReturn): void
    {
        $productId = (int) $item->product_id;
        $qty = (float) $item->base_quantity;
        $documentDate = $return->return_date?->format('Y-m-d');

        // A consumption composition line never moved the commercial product's
        // own stock at checkout, so restoring it here would create phantom
        // stock. Only explicitly recovered components may move the ledger.
        if ($isSaleReturn && $this->compositionRecoveries->isCompositionSaleItem((int) $item->reference_item_id)) {
            return;
        }

        // Sale returns restore the original sale cost; purchase returns use the
        // current weighted average.
        $movementCost = $isSaleReturn
            ? SaleItem::find($item->reference_item_id)?->cost_price
            : app(CostResolver::class)
                ->unitCost(Product::withArchived()->find($productId));

        if ($isSaleReturn) {
            if ($item->restock) {
                $this->inventory->recordReturn(
                    productId: $productId,
                    quantity: $qty,
                    returnType: 'sale',
                    packagingName: $item->packaging_name,
                    packagingQuantity: (float) $item->quantity,
                    reference: $return->return_number,
                    notes: 'Sale return — '.$return->return_number,
                    user: $return->created_by,
                    referenceId: $return->id,
                    unitCost: $movementCost,
                    documentDate: $documentDate,
                );

                return;
            }

            // Returned but not resellable: stock in, then written off.
            $this->inventory->recordAdjustment(
                productId: $productId,
                quantity: $qty,
                type: 'damage',
                reference: $return->return_number,
                notes: 'Returned, not resellable — '.$return->return_number,
                referenceType: 'return',
                referenceId: $return->id,
                user: $return->created_by,
                unitCost: $movementCost,
                documentDate: $documentDate,
            );
            $this->inventory->recordAdjustment(
                productId: $productId,
                quantity: -$qty,
                type: 'damage',
                reference: $return->return_number,
                notes: 'Written off — '.$return->return_number,
                referenceType: 'return',
                referenceId: $return->id,
                user: $return->created_by,
                unitCost: $movementCost,
                documentDate: $documentDate,
            );

            return;
        }

        if ($item->restock) {
            $this->inventory->recordReturn(
                productId: $productId,
                quantity: $qty,
                returnType: 'purchase',
                packagingName: $item->packaging_name,
                packagingQuantity: (float) $item->quantity,
                reference: $return->return_number,
                notes: 'Purchase return — '.$return->return_number,
                user: $return->created_by,
                referenceId: $return->id,
                unitCost: $movementCost,
                documentDate: $documentDate,
            );
        }
    }

    /**
     * Restoration is validated at creation for fast feedback, but eligibility
     * can change while a return is pending. Re-check before applying effects so
     * the second of two overlapping returns cannot restore more than was
     * consumed.
     */
    private function assertQuantitiesStillReturnable(ReturnModel $return): void
    {
        foreach ($return->items as $item) {
            $original = $this->findOriginalItem($return->reference_type, (int) $item->reference_item_id);

            if ($original === null) {
                throw new \InvalidArgumentException(
                    "Cannot complete return #{$return->id}: original line item #{$item->reference_item_id} no longer exists."
                );
            }

            $alreadyReturned = ReturnModel::returnedQuantityForItem(
                $item->reference_item_type,
                (int) $item->reference_item_id,
            );
            $available = (float) ($original['quantity'] ?? 0) - $alreadyReturned;

            if ((float) $item->quantity > $available) {
                throw new \InvalidArgumentException(
                    "Cannot complete return #{$return->id}: '{$item->product_name}' already has ".
                    "{$alreadyReturned} returned; only {$available} remains."
                );
            }
        }
    }

    /**
     * A pending return's value must still fit inside what the document has left
     * after every other completed return, so overlapping drafts cannot over-credit.
     */
    private function assertValueStillReturnable(ReturnModel $return): void
    {
        $documentValue = $return->type === 'SALE'
            ? (float) Sale::query()->whereKey($return->reference_id)->value('grand_total')
            : (float) PurchaseBill::query()->whereKey($return->reference_id)->value('total_amount');

        $completedElsewhere = (float) ReturnModel::query()
            ->where('reference_type', $return->reference_type)
            ->where('reference_id', $return->reference_id)
            ->where('status', 'completed')
            ->whereKeyNot($return->id)
            ->sum('grand_total');

        $available = round($documentValue - $completedElsewhere, 2);

        if ((float) $return->grand_total > $available + 0.01) {
            throw new \InvalidArgumentException(
                "Cannot complete return #{$return->id}: value ".
                number_format((float) $return->grand_total, 2).
                ' exceeds the '.number_format($available, 2).' still returnable on this document.'
            );
        }
    }

    /**
     * Restore declared recovered material for a sale return.
     *
     * Runs inside the completion transaction; any failure rolls the whole
     * return back, including the refund and the commercial stock effects.
     */
    private function restoreRecoveredMaterial(ReturnModel $return): void
    {
        $restoredLines = 0;

        foreach ($return->items as $item) {
            $saleItem = SaleItem::find($item->reference_item_id);

            if ($saleItem === null) {
                continue;
            }

            $restoredLines += $this->compositionRecoveries->restore($return, $item, $saleItem);
        }

        if ($restoredLines === 0) {
            return;
        }

        AuditLog::create([
            'user_id' => auth()->id(),
            'event' => 'composition.return_recovered',
            'auditable_type' => ReturnModel::class,
            'auditable_id' => $return->id,
            'description' => sprintf(
                'Restored %d recovered component line(s) for return %s',
                $restoredLines,
                $return->return_number,
            ),
            'reason' => $return->reason_note,
            'ip_address' => app()->runningInConsole() ? null : request()->ip(),
        ]);
    }

    /** Adjust the original document's return_total / return_status. */
    private function applyReturnToOriginal(ReturnModel $return, int $sign): void
    {
        $isSale = $return->type === 'SALE';
        $document = $isSale
            ? Sale::lockForUpdate()->find($return->reference_id)
            : PurchaseBill::lockForUpdate()->find($return->reference_id);

        if (! $document) {
            return;
        }

        $originalTotal = (float) ($isSale ? $document->grand_total : $document->total_amount);
        $newTotal = max(0, (float) $document->return_total + $sign * (float) $return->grand_total);

        $document->return_total = $newTotal;
        $document->return_status = $newTotal <= 0 ? 'none' : ($newTotal >= $originalTotal ? 'full' : 'partial');
        $document->save();
    }

    private function findOriginalItem(string $referenceType, int $itemId): ?array
    {
        if (in_array($referenceType, ['sale', 'sale_bill'], true)) {
            $item = SaleItem::with(['product' => fn ($q) => $q->withArchived()])->find($itemId);
        } else {
            $item = PurchaseBillItem::with(['product' => fn ($q) => $q->withArchived()])->find($itemId);
        }

        if (! $item) {
            return null;
        }

        $isPurchaseItem = $item instanceof PurchaseBillItem;

        return [
            'id' => $item->id,
            'sale_id' => $isPurchaseItem ? null : (int) $item->sale_id,
            'purchase_bill_id' => $isPurchaseItem ? (int) $item->purchase_bill_id : null,
            'product_id' => $item->product_id,
            'product_name' => $item->product_name ?? $item->product?->name ?? 'Unknown',
            'quantity' => $isPurchaseItem
                ? (float) ($item->purchase_quantity ?? 0)
                : (float) ($item->packaging_quantity ?? 0),
            'base_quantity' => $isPurchaseItem
                ? (float) ($item->purchase_quantity ?? 0) * (float) ($item->purchase_pack_qty ?? 0)
                : (float) ($item->base_quantity ?? 0),
            'unit_price' => (float) ($item->unit_price ?? 0),
            'total' => (float) ($item->total ?? 0),
        ];
    }
}
