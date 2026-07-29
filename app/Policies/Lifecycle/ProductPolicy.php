<?php

namespace App\Policies\Lifecycle;

use App\Contracts\Lifecycle\Archivable;
use App\Contracts\Lifecycle\Deletable;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class ProductPolicy implements Archivable, Deletable
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
        throw_if($record->sales()->exists() || $record->purchases()->exists(),
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
}
