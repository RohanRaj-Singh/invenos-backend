<?php

namespace App\Policies\Lifecycle;

use App\Contracts\Lifecycle\Deletable;
use App\Contracts\Lifecycle\PermanentDeletable;
use App\Contracts\Lifecycle\Restorable;
use App\Domains\Inventory\Services\InventoryService;
use App\Models\FinancialTransaction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User;

class SalePolicy implements Deletable, Restorable, PermanentDeletable
{
    public function __construct(
        private readonly InventoryService $inventoryService,
    ) {}

    // ─── Delete ────────────────────────────────────────────────

    public function canDelete(Model $record): void
    {
        throw_if($record->trashed(), 'Sale is already deleted.');

        $hasReturns = \App\Models\InventoryTransaction::where('reference', $record->invoice_number)
            ->where('type', 'sale-return')
            ->exists();

        throw_if($hasReturns,
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
                'Financial transaction will be reversed.',
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

        // Remove the financial transaction that was created with the sale
        FinancialTransaction::where('linked_sale_id', $record->id)
            ->where('type', 'invoice')
            ->delete();
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

        // Re-create the financial transaction
        if ($record->customer) {
            FinancialTransaction::create([
                'contact_id' => $record->customer->id,
                'direction' => 'in',
                'type' => 'invoice',
                'date' => $record->date,
                'amount' => $record->grand_total,
                'method' => 'invoice',
                'reference' => $record->invoice_number,
                'description' => "Sale: {$record->invoice_number} (restored)",
                'linked_sale_id' => $record->id,
                'created_by' => $user->name ?? 'System',
            ]);
        }
    }

    public function canPermanentDelete(Model $record): void
    {
        // Admin-only gate already applied in controller
    }
}