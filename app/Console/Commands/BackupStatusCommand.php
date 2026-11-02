<?php

namespace App\Console\Commands;

use App\Domains\Settings\Services\SettingService;
use App\Models\Backup;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackupStatusCommand extends Command
{
    protected $signature = 'backup:status {--limit=15 : How many recent backups to list}';

    protected $description = 'Show backup history, duplicate detection and schedule state';

    public function handle(): int
    {
        $settings = app(SettingService::class)->get();
        $backup = $settings['backup'] ?? [];

        $this->info('Automatic backups: '.(($backup['enabled'] ?? false) ? 'enabled' : 'disabled'));
        $this->line('Frequency: '.($backup['frequency'] ?? 'daily').' at '.($backup['time'] ?? '02:00').' ('.($backup['timezone'] ?? 'Asia/Karachi').')');
        $this->line('Retention: '.($backup['retain_daily'] ?? 7).' daily / '.($backup['retain_weekly'] ?? 4).' weekly / '.($backup['retain_monthly'] ?? 12).' monthly / '.($backup['retain_safety'] ?? 3).' safety');

        try {
            $this->line('Queued jobs: '.(int) DB::table('jobs')->count());
        } catch (\Throwable) {
            $this->line('Queued jobs: unavailable');
        }

        $counts = Backup::query()
            ->selectRaw('kind, status, COUNT(*) as total')
            ->groupBy('kind', 'status')
            ->orderBy('kind')
            ->get();

        if ($counts->isNotEmpty()) {
            $this->newLine();
            $this->table(['Kind', 'Status', 'Count'], $counts->map(fn ($row) => [$row->kind, $row->status, $row->total])->all());
        }

        $recent = Backup::query()->latest('created_at')->limit((int) $this->option('limit'))->get();

        if ($recent->isNotEmpty()) {
            $this->newLine();
            $this->table(
                ['ID', 'Created', 'Kind', 'Status', 'Size', 'File'],
                $recent->map(fn (Backup $b) => [
                    $b->id,
                    $b->created_at?->format('Y-m-d H:i:s'),
                    $b->kind,
                    $b->status,
                    $this->formatBytes((int) $b->size_bytes),
                    $b->filename,
                ])->all()
            );
        }

        $duplicates = $this->duplicateGroups();
        $this->newLine();
        $this->line('Possible duplicates (same kind within 2 minutes): '.($duplicates === [] ? 'none' : count($duplicates)));

        foreach ($duplicates as $group) {
            $this->warn(
                $group['kind'].': '.count($group['backups']).' backups between '.
                $group['from']->format('Y-m-d H:i:s').' and '.$group['to']->format('Y-m-d H:i:s')
            );
        }

        $lastFailure = Backup::query()->where('status', Backup::STATUS_FAILED)->latest('id')->first();
        if ($lastFailure) {
            $this->newLine();
            $this->warn('Last failure: #'.$lastFailure->id.' '.$lastFailure->failure_reason);
        }

        $workDir = (string) config('backup.work_dir');
        if (is_dir($workDir)) {
            $files = glob($workDir.DIRECTORY_SEPARATOR.'*') ?: [];
            $size = array_sum(array_map(fn ($path) => is_file($path) ? filesize($path) : 0, $files));
            $this->line('Work directory leftovers: '.count($files).' item(s), '.$this->formatBytes((int) $size));
        }

        $this->line('Log: storage/logs/backup.log');

        return self::SUCCESS;
    }

    private function duplicateGroups(): array
    {
        $backups = Backup::query()->whereIn('status', [Backup::STATUS_COMPLETED, Backup::STATUS_VERIFIED])
            ->orderBy('created_at')
            ->get();

        $groups = [];
        $current = null;

        foreach ($backups as $backup) {
            if (! $backup->created_at) {
                continue;
            }

            if ($current === null) {
                $current = ['kind' => $backup->kind, 'from' => $backup->created_at, 'to' => $backup->created_at, 'backups' => [$backup]];
                continue;
            }

            $gap = $backup->created_at->diffInSeconds($current['to']);
            $sameKind = $backup->kind === $current['kind'];

            if ($sameKind && $gap <= 120) {
                $current['to'] = $backup->created_at;
                $current['backups'][] = $backup;
                continue;
            }

            if (count($current['backups']) > 1) {
                $groups[] = $current;
            }

            $current = ['kind' => $backup->kind, 'from' => $backup->created_at, 'to' => $backup->created_at, 'backups' => [$backup]];
        }

        if ($current && count($current['backups']) > 1) {
            $groups[] = $current;
        }

        return $groups;
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes <= 0) {
            return '—';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $value = $bytes;
        $index = 0;

        while ($value >= 1024 && $index < count($units) - 1) {
            $value /= 1024;
            $index++;
        }

        return round($value, $value >= 10 ? 0 : 1).' '.$units[$index];
    }
}
