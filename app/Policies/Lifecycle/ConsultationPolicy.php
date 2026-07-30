<?php

namespace App\Policies\Lifecycle;

use App\Contracts\Lifecycle\Deletable;
use App\Contracts\Lifecycle\Restorable;
use App\Models\Consultation;
use App\Services\Lifecycle\RecordLifecycleService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User;

/**
 * Lifecycle policy for Consultations.
 *
 * Deleting a consultation reverses its business effects:
 *  - The linked Sale is lifecycle-deleted (inventory + customer balance reversed)
 *  - Prescriptions are cascade-soft-deleted (images preserved as historical artifacts)
 *
 * Restoring reverses the delete:
 *  - The linked Sale is restored from the Recycle Bin
 *  - Inventory and balance are re-applied
 */
class ConsultationPolicy implements Deletable, Restorable
{
    public function __construct(
        private readonly RecordLifecycleService $lifecycle,
    ) {}

    // ─── Delete ────────────────────────────────────────────────

    public function canDelete(Model $record): void
    {
        throw_if($record->trashed(), 'Consultation is already deleted.');
    }

    public function previewImpact(Model $record): array
    {
        /** @var Consultation $record */
        $sale = $record->sale;

        $impact = [
            'type' => 'consultation',
            'name' => 'Visit #' . $record->id,
            'records' => [
                "Consultation #{$record->id} moved to Recycle Bin.",
                'Prescriptions will be soft-deleted.',
                'Prescription images preserved as historical records.',
                'Audit log recorded.',
            ],
        ];

        if ($sale) {
            $impact['records'][] = "Sale {$sale->invoice_number} will also be deleted.";
            $impact['records'][] = 'Inventory will be added back (via Sale reversal).';
            $impact['records'][] = 'Customer balance will be updated.';
            $impact['inventory'] = $sale->items->map(fn($i) => [
                'product' => $i->product_name,
                'qty_added_back' => $i->base_quantity,
            ]);
            $impact['customer_balance'] = $sale->customer
                ? "Reduced by Rs. " . number_format($sale->grand_total)
                : null;
        }

        return $impact;
    }

    public function executeDelete(Model $record, User $user): void
    {
        /** @var Consultation $record */
        // Soft-delete linked Prescriptions (SoftDeletes does NOT cascade via FKs)
        foreach ($record->prescriptions as $prescription) {
            if (!$prescription->trashed()) {
                $prescription->delete_reason = 'Deleted with consultation #' . $record->id;
                $prescription->deleted_by = $user->id;
                $prescription->save();
                $prescription->delete(); // soft-delete
            }
        }

        // Delete the linked Sale via lifecycle (reverses inventory + balance)
        if ($record->sale && !$record->sale->trashed()) {
            $this->lifecycle->delete(
                $record->sale,
                'Reverse of deleted consultation #' . $record->id,
                $user,
            );
        }
    }

    // ─── Restore ───────────────────────────────────────────────

    public function canRestore(Model $record): void
    {
        throw_if(!$record->trashed(), 'Consultation is not deleted.');
    }

    public function executeRestore(Model $record, User $user): void
    {
        /** @var Consultation $record */
        // Restore linked Prescriptions (cascade-restore)
        foreach ($record->prescriptions as $prescription) {
            if ($prescription->trashed()) {
                $prescription->restore();
                $prescription->delete_reason = null;
                $prescription->deleted_by = null;
                $prescription->save();
            }
        }

        // Restore the linked Sale via lifecycle (re-applies inventory + balance)
        if ($record->sale && $record->sale->trashed()) {
            $this->lifecycle->restore($record->sale, $user);
        }
    }
}