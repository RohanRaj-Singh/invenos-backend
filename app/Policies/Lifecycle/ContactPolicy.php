<?php

namespace App\Policies\Lifecycle;

use App\Contracts\Lifecycle\Archivable;
use App\Contracts\Lifecycle\Deletable;
use App\Contracts\Lifecycle\PermanentDeletable;
use App\Models\ReturnModel;
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
        throw_if($record->sales()->exists(),
            'Cannot delete a contact with existing Sales. Delete the Sales first.');

        throw_if($record->purchases()->exists(),
            'Cannot delete a contact with existing Purchases. Delete the Purchases first.');

        throw_if($record->consultations()->exists(),
            'Cannot delete a contact with existing Visits. Delete the Visits first.');

        throw_if($record->prescriptions()->exists(),
            'Cannot delete a contact with existing Prescriptions.');

        throw_if($record->financialTransactions()->exists(),
            'Cannot delete a contact with financial transactions.');

        throw_if(ReturnModel::where('contact_id', $record->id)->exists(),
            'Cannot delete a contact with existing Returns.');
    }

    public function previewImpact(Model $record): array
    {
        return [
            'type' => 'contact',
            'name' => $record->name,
            'inventory' => null,
            'records' => [
                "Contact '{$record->name}' will be moved to the Recycle Bin.",
                'All related records have been removed.',
            ],
        ];
    }

    public function executeDelete(Model $record, User $user): void {}

    public function canPermanentDelete(Model $record): void {}
}
