<?php

namespace App\Domains\Returns\Services;

use App\Domains\Returns\DTOs\ReturnCreateData;
use App\Models\Contact;
use App\Models\FinancialTransaction;
use App\Models\InventoryTransaction;
use App\Models\PurchaseBill;
use App\Models\PurchaseBillItem;
use App\Models\ReturnModel;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

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
        private readonly \App\Domains\Inventory\Services\InventoryService $inventory,
        private readonly \App\Domains\Ledger\CashLedgerService $ledger,
    ) {}

    // ─── Return Number Generation ───────────────────────────────

    public function generateReturnNumber(string $type): string
    {
        $prefix = $type === 'SALE' ? 'SR-' : 'PR-';
        $count = DB::table('returns')
            ->where('return_number', 'like', $prefix . '%')
            ->count() + 1;
        $number = $prefix . str_pad((string) $count, 5, '0', STR_PAD_LEFT);

        while (DB::table('returns')->where('return_number', $number)->exists()) {
            $count++;
            $number = $prefix . str_pad((string) $count, 5, '0', STR_PAD_LEFT);
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

        foreach ($data->items as $item) {
            $originalItem = $this->findOriginalItem($data->referenceType, $item->referenceItemId);
            if (! $originalItem) {
                throw new \InvalidArgumentException("Original line item #{$item->referenceItemId} not found.");
            }

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
                    "Cannot return {$item->quantity} of '{$item->productName}'. " .
                    "Only {$remainingQty} remaining (original: {$originalQty}, already returned: {$previouslyReturned})."
                );
            }

            if ($item->baseQuantity <= 0) {
                throw new \InvalidArgumentException("Invalid base quantity for '{$item->productName}'.");
            }

            if ($item->unitPrice < 0) {
                throw new \InvalidArgumentException("Unit price cannot be negative for '{$item->productName}'.");
            }
        }
    }

    // ─── Preview ───────────────────────────────────────────────

    public function preview(ReturnCreateData $data): array
    {
        $isSaleReturn = $data->type === 'SALE';
        $contact = $data->contactId ? Contact::find($data->contactId) : null;

        $inventoryItems = [];
        foreach ($data->items as $item) {
            $product = \App\Models\Product::withArchived()->find($item->productId);
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
        $this->validate($data);

        return DB::transaction(function () use ($data) {
            $return = ReturnModel::create([
                'return_number' => $data->returnNumber ?: $this->generateReturnNumber($data->type),
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
                $return->items()->create([
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
            }

            return $return->load('items', 'contact', 'reason');
        });
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

            $isSaleReturn = $return->type === 'SALE';
            $contact = $return->contact_id ? Contact::lockForUpdate()->find($return->contact_id) : null;
            $date = $return->return_date?->format('Y-m-d') ?? now()->toDateString();

            // 1. Stock
            foreach ($return->items as $item) {
                $this->applyStock($return, $item, $isSaleReturn);
            }

            // 2. Party: the credit note reduces the balance by the return value.
            if ($contact) {
                \App\Domains\Ledger\PartyBalance::apply($contact, -(float) $return->grand_total);
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
                    'description' => ($isSaleReturn ? 'Refund for ' : 'Refund from supplier for ') . $return->return_number,
                    'linked_sale_id' => $isSaleReturn ? $return->reference_id : null,
                    'linked_purchase_id' => $isSaleReturn ? null : $return->reference_id,
                    'linked_return_id' => $return->id,
                    'source_type' => 'return',
                    'source_id' => $return->id,
                    'event_key' => 'refund:' . $return->id . ':' . $return->return_number,
                    'created_by' => $return->created_by,
                ]);

                if ($contact) {
                    \App\Domains\Ledger\PartyBalance::applyCash($contact, 'refund', $refund);
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
                    reference: 'REV-' . $return->return_number,
                    notes: 'Reversal of return ' . $return->return_number,
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
                    \App\Domains\Ledger\PartyBalance::reverseCash($contact, 'refund', (float) $refund->amount);
                }
                $this->ledger->reverse($refund, 'Return reversed', $user);
            }

            // 3. Undo the credit note.
            if ($contact) {
                \App\Domains\Ledger\PartyBalance::apply($contact, (float) $return->grand_total);
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

        // Sale returns restore the original sale cost; purchase returns use the
        // current weighted average.
        $movementCost = $isSaleReturn
            ? SaleItem::find($item->reference_item_id)?->cost_price
            : app(\App\Domains\Inventory\Services\CostResolver::class)
                ->unitCost(\App\Models\Product::withArchived()->find($productId));

        if ($isSaleReturn) {
            if ($item->restock) {
                $this->inventory->recordReturn(
                    productId: $productId,
                    quantity: $qty,
                    returnType: 'sale',
                    packagingName: $item->packaging_name,
                    packagingQuantity: (float) $item->quantity,
                    reference: $return->return_number,
                    notes: 'Sale return — ' . $return->return_number,
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
                notes: 'Returned, not resellable — ' . $return->return_number,
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
                notes: 'Written off — ' . $return->return_number,
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
                notes: 'Purchase return — ' . $return->return_number,
                user: $return->created_by,
                referenceId: $return->id,
                unitCost: $movementCost,
                documentDate: $documentDate,
            );
        }
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

        return [
            'id' => $item->id,
            'product_id' => $item->product_id,
            'product_name' => $item->product_name ?? $item->product?->name ?? 'Unknown',
            'quantity' => (float) ($item->packaging_quantity ?? 0),
            'base_quantity' => (float) ($item->base_quantity ?? 0),
            'unit_price' => (float) ($item->unit_price ?? 0),
            'total' => (float) ($item->total ?? 0),
        ];
    }
}
