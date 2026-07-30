<?php

namespace App\Policies\Lifecycle;

use App\Contracts\Lifecycle\Deletable;
use App\Contracts\Lifecycle\PermanentDeletable;
use App\Contracts\Lifecycle\Restorable;
use App\Domains\Inventory\Services\InventoryService;
use App\Models\FinancialTransaction;
use App\Models\InventoryTransaction;
use App\Models\ReturnModel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User;

class PurchasePolicy implements Deletable, Restorable, PermanentDeletable
{
    public function __construct(
        private readonly InventoryService $inventoryService,
    ) {}

    // ─── Delete ────────────────────────────────────────────────

    public function canDelete(Model $record): void
    {
        /** @var \App\Models\PurchaseBill $record */
        throw_if($record->trashed(), 'Purchase bill is already deleted.');

        // Check if any completed returns reference this purchase (preferred method)
        $hasReturns = ReturnModel::where('reference_type', 'purchase_bill')
            ->where('reference_id', $record->id)
            ->where('status', 'completed')
            ->exists();

        // Fallback check via inventory transactions for backward compatibility
        if (!$hasReturns) {
            $hasReturns = InventoryTransaction::where('reference', $record->invoice_ref)
                ->where('type', 'purchase-return')
                ->exists();
        }

        throw_if($hasReturns,
            'Cannot delete: a return references this purchase. Delete the return first.');
    }

    public function previewImpact(Model $record): array
    {
        /** @var \App\Models\PurchaseBill $record */
        $items = $record->items->map(fn($i) => [
            'product' => $i->product_name,
            'qty_removed' => -($i->purchase_pack_qty * $i->purchase_quantity),
        ]);

        return [
            'type' => 'purchase',
            'name' => $record->invoice_ref,
            'inventory' => $items,
            'supplier_balance' => $record->supplier
                ? "Reduced by Rs. " . number_format($record->total_amount)
                : null,
            'records' => [
                "Purchase bill {$record->invoice_ref} moved to Recycle Bin.",
                'Inventory will be reduced (stock added by this purchase removed).',
                'Supplier balance will be updated.',
                'Financial transaction will be reversed.',
                'Audit log will be recorded.',
            ],
        ];
    }

    public function executeDelete(Model $record, User $user): void
    {
        /** @var \App\Models\PurchaseBill $record */
        // Reverse inventory: remove stock that was added by this purchase
        foreach ($record->items as $item) {
            $baseQuantity = $item->purchase_pack_qty * $item->purchase_quantity;
            $this->inventoryService->recordAdjustment(
                productId: $item->product_id,
                quantity: -$baseQuantity,
                reference: 'REV-' . $record->invoice_ref,
                notes: 'Reversal of deleted purchase',
                user: $user->name ?? 'System',
            );
        }

        // Reverse supplier balance (decrement without clamping — consistent with SalePolicy)
        if ($record->supplier && $record->total_amount > 0) {
            $record->supplier->decrement('current_balance', $record->total_amount);
        }

        // Remove the financial transaction that was created with the purchase
        FinancialTransaction::where('reference', $record->invoice_ref)
            ->where('type', 'invoice')
            ->delete();
    }

    // ─── Restore ───────────────────────────────────────────────

    public function canRestore(Model $record): void
    {
        /** @var \App\Models\PurchaseBill $record */
        throw_if(!$record->trashed(), 'Purchase bill is not deleted.');
    }

    public function executeRestore(Model $record, User $user): void
    {
        /** @var \App\Models\PurchaseBill $record */
        // Re-apply inventory
        foreach ($record->items as $item) {
            $baseQuantity = $item->purchase_pack_qty * $item->purchase_quantity;
            $this->inventoryService->recordAdjustment(
                productId: $item->product_id,
                quantity: $baseQuantity,
                reference: 'RESTORE-' . $record->invoice_ref,
                notes: 'Restore of deleted purchase',
                user: $user->name ?? 'System',
            );
        }

        // Re-apply supplier balance (increment — consistent with SalePolicy)
        if ($record->supplier && $record->total_amount > 0) {
            $record->supplier->increment('current_balance', $record->total_amount);
        }

        // Re-create the financial transaction
        if ($record->supplier && $record->total_amount > 0) {
            FinancialTransaction::create([
                'contact_id' => $record->supplier->id,
                'direction' => 'out',
                'type' => 'invoice',
                'date' => $record->date,
                'amount' => $record->total_amount,
                'method' => 'invoice',
                'reference' => $record->invoice_ref,
                'description' => "Purchase: {$record->invoice_ref} (restored)",
                'created_by' => $user->name ?? 'System',
            ]);
        }
    }

    public function canPermanentDelete(Model $record): void
    {
        // Admin-only gate already applied in controller
    }
}