<?php

namespace App\Services\Lifecycle;

use App\Contracts\Lifecycle\Archivable;
use App\Contracts\Lifecycle\Deletable;
use App\Contracts\Lifecycle\PermanentDeletable;
use App\Contracts\Lifecycle\Restorable;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Platform-level lifecycle service.
 *
 * Single entry point for Archive, Delete, Restore, Permanent Delete.
 * Every module uses this — never call SoftDeletes directly.
 */
class RecordLifecycleService
{
    /** @var array<string, string> entity_class → policy_class */
    private array $policies = [];

    public function __construct(
        private readonly AuditService $audit,
    ) {}

    /**
     * Register a lifecycle policy for an entity.
     */
    public function register(string $entityClass, string $policyClass): void
    {
        $this->policies[$entityClass] = $policyClass;
    }

    // ─── Archive ───────────────────────────────────────────────

    public function archive(Model $record, string $reason, User $user): void
    {
        $policy = $this->resolve($record, Archivable::class);
        $policy->canArchive($record);

        $record->archived_at = now();
        $record->archive_reason = $reason;
        $record->archived_by = $user->id;
        $record->save();

        $this->audit->log(
            user: $user,
            event: class_basename($record) . '.archived',
            record: $record,
            reason: $reason,
        );
    }

    // ─── Delete (soft) ─────────────────────────────────────────

    public function delete(Model $record, string $reason, User $user): array
    {
        $policy = $this->resolve($record, Deletable::class);
        $policy->canDelete($record);
        $impact = $policy->previewImpact($record);

        DB::transaction(function () use ($record, $reason, $user, $policy) {
            $record->lockForUpdate();
            $policy->executeDelete($record, $user);
            $record->delete_reason = $reason;
            $record->deleted_by = $user->id;
            $record->save();
            $record->delete(); // SoftDeletes
            $this->audit->log($user, class_basename($record) . '.deleted', $record, $reason);
        });

        return $impact;
    }

    // ─── Restore ───────────────────────────────────────────────

    public function restore(Model $record, User $user): void
    {
        $policy = $this->resolve($record, Restorable::class);
        $policy->canRestore($record);

        DB::transaction(function () use ($record, $user, $policy) {
            $record->lockForUpdate();
            $record->restore();
            $policy->executeRestore($record, $user);
            $record->delete_reason = null;
            $record->deleted_by = null;
            $record->save();
            $this->audit->log($user, class_basename($record) . '.restored', $record);
        });
    }

    // ─── Permanent Delete ──────────────────────────────────────

    public function permanentlyDelete(Model $record, User $user): void
    {
        $policy = $this->resolve($record, PermanentDeletable::class);
        $policy->canPermanentDelete($record);

        $this->audit->log($user, class_basename($record) . '.permanently_deleted', $record);
        $record->forceDelete();
    }

    // ─── Internal ──────────────────────────────────────────────

    private function resolve(Model $record, string $interface): object
    {
        $class = get_class($record);
        $policyClass = $this->policies[$class] ?? null;

        if (!$policyClass) {
            throw new \RuntimeException("No lifecycle policy registered for {$class}.");
        }

        $policy = app($policyClass);

        if (!($policy instanceof $interface)) {
            throw new \RuntimeException(
                get_class($policy) . " does not implement {$interface}."
            );
        }

        return $policy;
    }
}
