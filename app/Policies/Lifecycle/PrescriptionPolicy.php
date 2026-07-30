<?php

namespace App\Policies\Lifecycle;

use App\Contracts\Lifecycle\Deletable;
use App\Contracts\Lifecycle\Restorable;
use App\Models\Prescription;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User;

/**
 * Lifecycle policy for standalone Prescription deletion.
 *
 * Deleting a prescription (without deleting the parent consultation):
 *  - Soft-deletes the prescription record
 *  - No inventory impact (sale items remain)
 *  - Images are cascade-soft-deleted (preserved on disk)
 *
 * Deleting a consultation ALSO deletes its prescriptions (cascade).
 * In that case the ConsultationPolicy handles the linked Sale lifecycle.
 */
class PrescriptionPolicy implements Deletable, Restorable
{
    // ─── Delete ────────────────────────────────────────────────

    public function canDelete(Model $record): void
    {
        throw_if($record->trashed(), 'Prescription is already deleted.');
    }

    public function previewImpact(Model $record): array
    {
        /** @var Prescription $record */
        return [
            'type' => 'prescription',
            'name' => 'Prescription #' . $record->id,
            'records' => [
                "Prescription #{$record->id} moved to Recycle Bin.",
                'Prescription items soft-deleted.',
                'No inventory impact — sale items remain unchanged.',
                'Audit log recorded.',
            ],
        ];
    }

    public function executeDelete(Model $record, User $user): void
    {
        // No inventory or balance reversal needed.
        // Prescription items/images are cascade-soft-deleted.
    }

    // ─── Restore ───────────────────────────────────────────────

    public function canRestore(Model $record): void
    {
        throw_if(!$record->trashed(), 'Prescription is not deleted.');
    }

    public function executeRestore(Model $record, User $user): void
    {
        // Cascade-restores items and images.
        // No inventory or balance impact.
    }
}