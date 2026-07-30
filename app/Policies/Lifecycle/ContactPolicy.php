<?php

namespace App\Policies\Lifecycle;

use App\Contracts\Lifecycle\Archivable;
use App\Contracts\Lifecycle\Deletable;
use App\Contracts\Lifecycle\PermanentDeletable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User;

class ContactPolicy implements Archivable, Deletable, PermanentDeletable
{
    public function canArchive(Model $record): void
    {
        // Always allowed
    }

    public function executeArchive(Model $record, User $user): void {}

    public function canDelete(Model $record): void
    {
        throw_if($record->sales()->exists() || $record->purchases()->exists(),
            'Cannot delete a contact with transaction history. Archive it instead.');
    }

    public function previewImpact(Model $record): array
    {
        return [
            'type' => 'contact',
            'name' => $record->name,
            'inventory' => null,
            'records' => [
                "Contact '{$record->name}' will be moved to the Recycle Bin.",
                'Historical transactions will remain unchanged.',
            ],
        ];
    }

    public function executeDelete(Model $record, User $user): void {}

    public function canPermanentDelete(Model $record): void {}
}
