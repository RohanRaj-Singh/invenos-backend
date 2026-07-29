<?php

namespace App\Services\Lifecycle;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User;

/**
 * Logs lifecycle actions — delete, archive, restore, permanent delete.
 * Each entry captures user, event, entity, reason, and state snapshots.
 */
class AuditService
{
    public function log(
        User $user,
        string $event,
        Model $record,
        ?string $reason = null,
    ): AuditLog {
        return AuditLog::create([
            'user_id' => $user->id,
            'event' => $event,
            'auditable_type' => get_class($record),
            'auditable_id' => $record->getKey(),
            'description' => $this->buildDescription($event, $record),
            'reason' => $reason,
            'ip_address' => request()->ip(),
        ]);
    }

    private function buildDescription(string $event, Model $record): string
    {
        $name = method_exists($record, 'getName') ? $record->getName() : ($record->name ?? $record->getKey());
        $type = class_basename($record);

        return match (true) {
            str_ends_with($event, '.archived') => "{$type} '{$name}' archived",
            str_ends_with($event, '.deleted') => "{$type} '{$name}' deleted",
            str_ends_with($event, '.restored') => "{$type} '{$name}' restored",
            str_ends_with($event, '.permanently_deleted') => "{$type} '{$name}' permanently deleted",
            default => "{$type} '{$name}' {$event}",
        };
    }
}
