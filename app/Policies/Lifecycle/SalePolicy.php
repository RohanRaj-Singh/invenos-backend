<?php

namespace App\Policies\Lifecycle;

use App\Contracts\Lifecycle\Deletable;
use App\Contracts\Lifecycle\Restorable;
use App\Domains\Inventory\Services\InventoryService;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class SalePolicy implements Deletable, Restorable
{
    public function __construct(
        private readonly InventoryService $inventoryService,
    ) {}

    // ─── Delete ────────────────────────────────────────────────

    public function canDelete(Model $record): void
    {
        throw_if($record->trashed(), 'Sale is already deleted.');

        $hasReturns = $record->returns()->exists()
            ?? \App\Models\SaleItem::where('sale_id', $record->id)
                ->whereHas('prescriptionItem')
                ->exists();

        // Simple check: does a SaleReturn reference this sale?
        // Since SaleReturn isn't fully built, check inventory transactions
        $hasLinkedTxns = \App\Models\InventoryTransaction::where('reference', $record->invoice_number)
            ->where('type', 'return')
            ->exists();

        throw_if($hasReturns || $hasLinkedTxns,
            'Cannot delete: a return references this sale. Delete the return first.');
    }

    public function previewImpact(Model $record): array
    {
        $items = $record->items->map(fn($i) => [
            'product' => $i->product_name,
            'qty_added_back' => $i->base_quantity,
        ]);

        return [
            'type' => 'sale',
            'name' => $record->invoice_number,
            'inventory' => $items,
            'customer_balance' => $record->customer
                ? "Reduced by Rs. " . number_format($record->grand_total)
                : null,
            'records' => [
                "Invoice {$record->invoice_number} moved to Recycle Bin.",
                'Inventory will be added back.',
                'Payment will be reversed.',
                'Customer balance will be updated.',
                'Audit log will be recorded.',
            ],
        ];
    }

    public function executeDelete(Model $record, User $user): void
    {
        // Reverse inventory for each sale item
        foreach ($record->items as $item) {
            $this->inventoryService->recordAdjustment(
                productId: $item->product_id,
                quantity: $item->base_quantity,
                reference: 'REV-' . $record->invoice_number,
                notes: 'Reversal of deleted sale',
                user: $user->name ?? 'System',
            );
        }

        // Reverse customer balance
        if ($record->customer) {
            $record->customer->decrement('current_balance', $record->grand_total);
        }
    }

    // ─── Restore ───────────────────────────────────────────────

    public function canRestore(Model $record): void
    {
        throw_if(!$record->trashed(), 'Sale is not deleted.');
    }

    public function executeRestore(Model $record, User $user): void
    {
        // Re-apply inventory deduction
        foreach ($record->items as $item) {
            $this->inventoryService->recordAdjustment(
                productId: $item->product_id,
                quantity: -$item->base_quantity,
                reference: 'RESTORE-' . $record->invoice_number,
                notes: 'Restore of deleted sale',
                user: $user->name ?? 'System',
            );
        }

        // Re-apply customer balance
        if ($record->customer) {
            $record->customer->increment('current_balance', $record->grand_total);
        }
    }
}
