<?php

namespace App\Policies\Lifecycle;

use App\Contracts\Lifecycle\Archivable;
use App\Contracts\Lifecycle\Deletable;
use App\Contracts\Lifecycle\PermanentDeletable;
use App\Models\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User;

class ProductPolicy implements Archivable, Deletable, PermanentDeletable
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
        /** @var Product $record */
        throw_if($record->stock_quantity > 0,
            'Cannot delete a product with stock. Archive it instead.');

        $hasTransactions = \App\Models\SaleItem::where('product_id', $record->id)->exists()
            || \App\Models\PurchaseBillItem::where('product_id', $record->id)->exists();

        throw_if($hasTransactions,
            'Cannot delete a product with transaction history. Archive it instead.');
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

    public function canPermanentDelete(Model $record): void
    {
        // Admin-only gate already applied in controller
    }
}
