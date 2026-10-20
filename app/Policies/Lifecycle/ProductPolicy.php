<?php

namespace App\Policies\Lifecycle;

use App\Contracts\Lifecycle\Archivable;
use App\Contracts\Lifecycle\Deletable;
use App\Contracts\Lifecycle\PermanentDeletable;
use App\Contracts\Lifecycle\Restorable;
use App\Models\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User;

class ProductPolicy implements Archivable, Deletable, Restorable, PermanentDeletable
{
    public function canArchive(Model $record): void
    {
        // Always allowed — archiving is safe
    }

    public function executeArchive(Model $record, User $user): void
    {
        // No additional operations needed for archive
    }

    public function canDelete(Model $record): void
    {
        // Stock quantity alone does not block deletion — if all transactions
        // have been reversed, remaining stock is cleaned up during delete.
        throw_if(
            $this->deleteBlocker($record) !== null,
            'Cannot delete a product with transaction history. Archive it instead.'
        );
    }

    /**
     * null when the product can be deleted, otherwise the usage counts that block it.
     * Single source of truth for both canDelete() and the UI preflight.
     */
    public function deleteBlocker(Model $record): ?array
    {
        /** @var Product $record */
        $sales = \App\Models\SaleItem::where('product_id', $record->id)->count();
        $purchases = \App\Models\PurchaseBillItem::where('product_id', $record->id)->count();

        if ($sales === 0 && $purchases === 0) {
            return null;
        }

        return ['sales' => $sales, 'purchases' => $purchases];
    }

    public function previewImpact(Model $record): array
    {
        /** @var Product $record */
        return [
            'type' => 'product',
            'name' => $record->name,
            'inventory' => null,
            'records' => [
                "Product '{$record->name}' will be moved to the Recycle Bin.",
                'Historical transactions will remain unchanged.',
                'Inventory is not affected.',
            ],
        ];
    }

    public function executeDelete(Model $record, User $user): void
    {
        // No inventory reversal needed for products
    }

    // ─── Restore ───────────────────────────────────────────────

    public function canRestore(Model $record): void
    {
        throw_if(!$record->trashed(), 'Product is not deleted.');
    }

    public function executeRestore(Model $record, User $user): void
    {
        // Product delete has no side effects to reverse.
    }

    public function canPermanentDelete(Model $record): void
    {
        // Admin-only gate already applied in controller
    }
}
