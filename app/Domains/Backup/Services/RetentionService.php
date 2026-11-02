<?php

namespace App\Domains\Backup\Services;

use App\Models\Backup;
use Illuminate\Support\Facades\Storage;

class RetentionService
{
    /**
     * Prune completed backups according to the configured daily/weekly/monthly
     * buckets. Safety backups are retained separately.
     *
     * @return array{deleted: int, kept: int}
     */
    public function prune(): array
    {
        $backups = Backup::query()
            ->completed()
            ->where('kind', Backup::KIND_SCHEDULED)
            ->orderByDesc('completed_at')
            ->orderByDesc('created_at')
            ->get();

        $protect = [];
        $newest = $backups->first();
        if ($newest) {
            $protect[$newest->id] = true;
        }

        $buckets = [
            'daily' => ['format' => 'Y-m-d', 'limit' => (int) (config('backup.retention.daily') ?? 7)],
            'weekly' => ['format' => 'o-W', 'limit' => (int) (config('backup.retention.weekly') ?? 4)],
            'monthly' => ['format' => 'Y-m', 'limit' => (int) (config('backup.retention.monthly') ?? 12)],
        ];

        foreach ($buckets as $bucket) {
            $periods = [];

            foreach ($backups as $backup) {
                $period = ($backup->completed_at ?? $backup->created_at)->format($bucket['format']);

                if (! isset($periods[$period])) {
                    $periods[$period] = $backup->id;
                }

                if (count($periods) >= $bucket['limit']) {
                    break;
                }
            }

            foreach ($periods as $id) {
                $protect[$id] = true;
            }
        }

        $deleted = 0;

        foreach ($backups as $backup) {
            if (isset($protect[$backup->id])) {
                continue;
            }

            $this->discard($backup);
            $deleted++;
        }

        $safetyKeep = (int) (config('backup.retention.safety') ?? 3);
        $safety = Backup::query()
            ->where('kind', Backup::KIND_SAFETY)
            ->orderByDesc('created_at')
            ->get();

        foreach ($safety->slice($safetyKeep) as $backup) {
            $this->discard($backup);
            $deleted++;
        }

        return ['deleted' => $deleted, 'kept' => Backup::query()->count()];
    }

    private function discard(Backup $backup): void
    {
        try {
            Storage::disk($backup->disk)->delete($backup->path);
        } catch (\Throwable) {
        }

        $backup->forceFill(['status' => Backup::STATUS_EXPIRED])->save();
        $backup->delete();
    }
}
