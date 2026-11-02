<?php

namespace App\Console\Commands;

use App\Domains\Backup\Services\BackupService;
use App\Domains\Backup\Services\RetentionService;
use App\Domains\Settings\Services\SettingService;
use App\Models\Backup;
use Illuminate\Console\Command;
use Throwable;

class BackupRunCommand extends Command
{
    protected $signature = 'backup:run
        {--scheduled : Run only when the configured schedule is due}
        {--password= : Encrypt the backup with this password}
        {--no-uploads : Skip prescription images and branding assets}
        {--force : Create a backup even if one completed recently}';

    protected $description = 'Create a verified database and files backup';

    public function handle(BackupService $service, RetentionService $retention): int
    {
        $settings = app(SettingService::class)->get();
        $backupSettings = $settings['backup'] ?? [];

        if ($this->option('scheduled')) {
            $reason = $this->scheduledRunBlockReason($backupSettings, $settings['business']['timezone'] ?? null);

            if ($reason !== null) {
                $this->info($reason);

                return self::SUCCESS;
            }
        }

        if (! $this->option('scheduled') && ! $this->option('force')) {
            $window = (int) config('backup.cli_duplicate_window_minutes', 5);

            $recent = Backup::query()
                ->whereIn('status', [Backup::STATUS_COMPLETED, Backup::STATUS_VERIFIED])
                ->where('created_at', '>=', now()->subMinutes(max(1, $window)))
                ->latest('id')
                ->first();

            if ($recent) {
                $this->info("Skipped: {$recent->filename} was created ".$recent->created_at->diffForHumans().'. Use --force to create another.');

                return self::SUCCESS;
            }
        }

        $password = $this->option('password') ?: (env('BACKUP_PASSWORD') ?: null);

        if (! $this->option('no-uploads')) {
            $this->applyUploadSources();
        }

        try {
            $backup = $service->create(
                $password,
                null,
                $this->option('scheduled') ? Backup::KIND_SCHEDULED : Backup::KIND_MANUAL
            );

            $pruned = $retention->prune();

            $this->info("Backup created: {$backup->filename} (".number_format($backup->size_bytes / 1024 / 1024, 2).' MB)');
            $this->line("Retention removed {$pruned['deleted']} expired backup(s), {$pruned['kept']} remaining.");

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error('Backup failed: '.$e->getMessage());

            return self::FAILURE;
        }
    }

    private function scheduledRunBlockReason(array $backupSettings, ?string $fallbackTimezone): ?string
    {
        if (! ($backupSettings['enabled'] ?? false)) {
            return 'Automatic backups are disabled.';
        }

        $timezone = $backupSettings['timezone'] ?? $fallbackTimezone ?? 'Asia/Karachi';
        $now = now($timezone);
        $configuredTime = (string) ($backupSettings['time'] ?? '02:00');

        if ($now->format('H:i') < $configuredTime) {
            return 'Scheduled time has not been reached yet.';
        }

        $frequency = (string) ($backupSettings['frequency'] ?? 'daily');
        $format = match ($frequency) {
            'weekly' => 'o-W',
            'monthly' => 'Y-m',
            default => 'Y-m-d',
        };

        $last = Backup::query()
            ->where('kind', Backup::KIND_SCHEDULED)
            ->latest('created_at')
            ->first();

        if ($last && $last->created_at->copy()->timezone($timezone)->format($format) === $now->format($format)) {
            return 'A scheduled backup already ran for this period.';
        }

        return null;
    }

    private function applyUploadSources(): void
    {
        config(['backup.file_sources' => [
            'prescriptions' => storage_path('app/prescriptions'),
            'logos' => storage_path('app/public/logos'),
        ]]);
    }
}
