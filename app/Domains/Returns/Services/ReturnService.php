<?php

namespace App\Domains\Returns\Services;

use App\Domains\Returns\DTOs\ReturnCreateData;
use App\Domains\Transactions\Services\TransactionEngine;
use App\Models\ReturnModel;
use App\Models\ReturnItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\PurchaseBill;
use App\Models\PurchaseBillItem;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * Service for managing return documents.
 *
 * Returns follow a lifecycle:
 *   Pending → (create document, no effects)
 *   Completed → (process via TransactionEngine — inventory, balance, financial)
 *   Cancelled → (void, no effects)
 *
 * Sale Return inventory effect: +quantity (stock goes UP)
 * Purchase Return inventory effect: -quantity (stock goes DOWN)
 */
class ReturnService
{
    public function __construct(
        private readonly TransactionEngine $transactionEngine,
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
     * Validate that return quantities don't exceed the original document's quantities
     * (accounting for previously completed returns).
     *
     * @throws \InvalidArgumentException
     */
    public function validate(ReturnCreateData $data): void
    {
        if (empty($data->items)) {
            throw new \InvalidArgumentException('Return must have at least one item.');
        }

        foreach ($data->items as $item) {
            // Look up the original line item
            $originalItem = $this->findOriginalItem($data->referenceType, $item->referenceItemId);
            if (!$originalItem) {
                throw new \InvalidArgumentException("Original line item #{$item->referenceItemId} not found.");
            }

            $originalQty = (float) ($originalItem['quantity'] ?? $originalItem['packaging_quantity'] ?? 0);
            $originalBaseQty = (float) ($originalItem['base_quantity'] ?? 0);

            // Get previously returned quantity for this line item
            $previouslyReturned = ReturnModel::returnedQuantityForItem(
                $item->referenceItemType,
                $item->referenceItemId,
            );

            $remainingQty = $originalQty - $previouslyReturned;
            $remainingBaseQty = $originalBaseQty - $previouslyReturned;

            if ($item->quantity <= 0) {
                throw new \InvalidArgumentException(
                    "Invalid return quantity for '{$item->productName}'."
                );
            }

            if ($item->quantity > $remainingQty) {
                throw new \InvalidArgumentException(
                    "Cannot return {$item->quantity} of '{$item->productName}'. " .
                    "Only {$remainingQty} remaining (original: {$originalQty}, already returned: {$previouslyReturned})."
                );
            }

            if ($item->baseQuantity <= 0) {
                throw new \InvalidArgumentException(
                    "Invalid base quantity for '{$item->productName}'."
                );
            }

            if ($item->unitPrice < 0) {
                throw new \InvalidArgumentException(
                    "Unit price cannot be negative for '{$item->productName}'."
                );
            }
        }
    }

    // ─── Preview ───────────────────────────────────────────────

    /**
     * Preview the full impact of a return before confirming.
     *
     * Returns a structured preview with:
     * - Inventory: what stock changes
     * - Financial: refund/credit details
     * - Contact Balance: before/after/change
     * - Reports Impact: how net values are affected
     */
    public function preview(ReturnCreateData $data): array
    {
        $isSaleReturn = $data->type === 'SALE';

        // Get contact info
        $contact = null;
        if ($data->contactId) {
            $contact = \App\Models\Contact::find($data->contactId);
        }

        // Build inventory section
        $inventoryItems = [];
        foreach ($data->items as $item) {
            $product = \App\Models\Product::find($item->productId);
            $qty = $isSaleReturn ? $item->baseQuantity : -$item->baseQuantity;
            $inventoryItems[] = [
                'product' => $product?->name ?? $item->productName,
                'quantity' => $qty,
                'unit' => $item->packagingName ?? 'units',
                'display_qty' => $isSaleReturn
                    ? "+{$item->quantity} {$item->packagingName}"
                    : "-{$item->quantity} {$item->packagingName}",
            ];
        }

        // Build financial section
        $financialSection = [
            'subtotal' => $data->subtotal,
            'discount' => $data->discount,
            'refund_amount' => $data->refundAmount,
            'method' => $data->refundMethod,
            'is_refund' => $data->refundAmount > 0,
        ];

        // Build contact balance section
        $balanceSection = null;
        if ($contact) {
            $currentBalance = (float) $contact->current_balance;
            $balanceSection = [
                'contact_name' => $contact->name,
                'current_balance' => $currentBalance,
                'change' => -$data->grandTotal,
                'new_balance' => max(0, $currentBalance - $data->grandTotal),
                'direction' => $isSaleReturn ? 'decrease' : 'decrease',
            ];
        }

        // Build reports impact section
        $reportsImpact = [];
        if ($isSaleReturn) {
            $reportsImpact[] = "Net Sales: -" . number_format($data->grandTotal);
            foreach ($data->items as $item) {
                $reportsImpact[] = "Sale quantity ({$item->productName}): -{$item->baseQuantity} base units";
            }
        } else {
            $reportsImpact[] = "Net Purchases: -" . number_format($data->grandTotal);
            foreach ($data->items as $item) {
                $reportsImpact[] = "Purchase quantity ({$item->productName}): -{$item->baseQuantity} base units";
            }
        }

        return [
            'type' => $isSaleReturn ? 'Sale Return' : 'Purchase Return',
            'document_number' => $data->returnNumber,
            'inventory' => $inventoryItems,
            'financial' => $financialSection,
            'balance' => $balanceSection,
            'reports_impact' => $reportsImpact,
        ];
    }

    // ─── Create Return (Pending) ───────────────────────────────

    /**
     * Create a return document in 'pending' status.
     * No inventory/financial/balance effects are applied yet.
     */
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
                    'reason_id' => $item->reasonId,
                    'notes' => $item->notes,
                ]);
            }

            return $return->load('items', 'contact', 'reason');
        });
    }

    // ─── Complete Return (Apply Effects) ───────────────────────

    /**
     * Complete a pending return — applies all effects via TransactionEngine:
     * - Inventory movements (add back to stock for sale returns)
     * - Financial transaction (refund/credit)
     * - Contact balance update
     * - Updates original document's return_total/return_status
     */
    public function completeReturn(int $id): ReturnModel
    {
        $return = ReturnModel::with('items')->findOrFail($id);

        if ($return->status !== 'pending') {
            throw new \InvalidArgumentException(
                "Cannot complete return #{$return->id}: status is '{$return->status}', expected 'pending'."
            );
        }

        if ($return->items->isEmpty()) {
            throw new \InvalidArgumentException("Cannot complete return #{$return->id}: no items.");
        }

        DB::transaction(function () use ($return) {
            $isSaleReturn = $return->type === 'SALE';

            // Lock the original document
            $originalDoc = $isSaleReturn
                ? Sale::lockForUpdate()->findOrFail($return->reference_id)
                : PurchaseBill::lockForUpdate()->findOrFail($return->reference_id);

            // Build TransactionData for the engine
            $itemData = $return->items->map(fn ($item) => [
                'product_id' => $item->product_id,
                'product_name' => $item->product_name,
                'selling_unit_id' => $item->selling_unit_id,
                'packaging_name' => $item->packaging_name,
                'quantity' => $item->quantity,
                'base_quantity' => $item->base_quantity,
                'unit_price' => (float) $item->unit_price,
                'total' => (float) $item->total,
                'reference_item_id' => $item->reference_item_id,
                'reference_item_type' => $item->reference_item_type,
            ])->toArray();

            $transactionData = new \App\Domains\Transactions\DTOs\TransactionData(
                documentNumber: $return->return_number,
                typeKey: 'return',
                contactId: $return->contact_id,
                date: $return->return_date?->format('Y-m-d') ?? now()->format('Y-m-d'),
                items: $itemData,
                grandTotal: (float) $return->grand_total,
                paymentMethod: $return->refund_method ?? 'credit',
                paymentStatus: 'paid',
                source: 'return',
                notes: "Return {$return->return_number}" . ($return->reason_note ? " — {$return->reason_note}" : ''),
                createdBy: $return->created_by,
                referenceId: $return->reference_id,
                referenceType: $isSaleReturn ? 'sale' : 'purchase',
            );

            // Process via TransactionEngine (inventory + financial + balance)
            $this->transactionEngine->process($transactionData);

            // Update original document's return tracking
            $currentReturnTotal = (float) $originalDoc->return_total;
            $newReturnTotal = $currentReturnTotal + (float) $return->grand_total;

            $totalOriginal = $isSaleReturn
                ? (float) $originalDoc->grand_total
                : (float) $originalDoc->total_amount;

            $returnStatus = 'none';
            if ($newReturnTotal >= $totalOriginal) {
                $returnStatus = 'full';
            } elseif ($newReturnTotal > 0) {
                $returnStatus = 'partial';
            }

            $originalDoc->return_total = $newReturnTotal;
            $originalDoc->return_status = $returnStatus;
            $originalDoc->save();

            // Update the return status
            $return->status = 'completed';
            $return->save();
        });

        return $return->fresh()->load('items', 'contact', 'reason', 'reference');
    }

    // ─── Cancel Return ──────────────────────────────────────────

    /**
     * Cancel a pending return — no effects applied, just voided.
     */
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

    /**
     * Get a single return with all relations.
     */
    public function get(int $id): ReturnModel
    {
        return ReturnModel::withTrashed()
            ->with(['items.product', 'contact', 'reason', 'reference'])
            ->findOrFail($id);
    }

    /**
     * Search returns with filters.
     */
    public function search(
        string $query = '',
        ?string $type = null,
        ?string $status = null,
        string $dateFrom = '',
        string $dateTo = '',
        int $perPage = 25,
    ): LengthAwarePaginator {
        $q = ReturnModel::withTrashed()
            ->with(['contact', 'reason']);

        if ($type && in_array($type, ['SALE', 'PURCHASE'])) {
            $q->where('type', $type);
        }

        if ($status && in_array($status, ['pending', 'completed', 'cancelled'])) {
            $q->where('status', $status);
        }

        if ($query) {
            $q->where(function ($q) use ($query) {
                $q->where('return_number', 'like', "%{$query}%")
                  ->orWhereHas('contact', fn($cq) => $cq->where('name', 'like', "%{$query}%"));
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

    /**
     * Get all returns for a specific original document.
     */
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

    /**
     * Find an original line item from a sale or purchase bill.
     */
    private function findOriginalItem(string $referenceType, int $itemId): ?array
    {
        if ($referenceType === 'sale' || $referenceType === 'sale_bill') {
            $item = SaleItem::with('product')->find($itemId);
        } else {
            $item = PurchaseBillItem::with('product')->find($itemId);
        }

        if (!$item) {
            return null;
        }

        return [
            'id' => $item->id,
            'product_id' => $item->product_id,
            'product_name' => $item->product_name ?? $item->product?->name ?? 'Unknown',
            'quantity' => (float) ($item->packaging_quantity ?? $item->quantity ?? 0),
            'base_quantity' => (float) ($item->base_quantity ?? 0),
            'unit_price' => (float) ($item->unit_price ?? 0),
            'total' => (float) ($item->total ?? 0),
        ];
    }
}
