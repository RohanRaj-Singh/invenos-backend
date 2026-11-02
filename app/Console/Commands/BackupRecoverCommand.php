<?php

namespace App\Console\Commands;

use App\Models\RestoreRun;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class BackupRecoverCommand extends Command
{
    protected $signature = 'backup:recover
        {--minutes=10 : Treat restore runs older than this as interrupted}
        {--password= : Password for the safety backup if you choose to restore it manually}';

    protected $description = 'Take the application out of maintenance mode after a failed restore';

    public function handle(): int
    {
        $minutes = max(1, (int) $this->option('minutes'));

        $stale = RestoreRun::query()
            ->where('status', RestoreRun::STATUS_RUNNING)
            ->where('started_at', '<', now()->subMinutes($minutes))
            ->get();

        foreach ($stale as $run) {
            $run->forceFill([
                'status' => RestoreRun::STATUS_FAILED,
                'completed_at' => now(),
                'failure_reason' => 'Restore was interrupted before it could finish.',
            ])->save();

            $this->warn("Restore #{$run->id} marked as interrupted.");
        }

        Artisan::call('up');

        $latest = RestoreRun::query()->latest('id')->first();
        $running = file_exists(storage_path('framework/down'));

        $this->info('Maintenance mode: '.($running ? 'still on' : 'off'));

        if ($latest) {
            $this->line("Last restore: #{$latest->id} ({$latest->status})");
            $this->line('Artifact: '.($latest->artifact_name ?? '—'));

            if ($latest->failure_reason) {
                $this->warn('Failure: '.$latest->failure_reason);
            }

            if ($latest->safety_backup_id) {
                $safety = $latest->safetyBackup;
                $this->line('Safety backup: #'.$latest->safety_backup_id.($safety ? ' ('.$safety->filename.')' : ''));
                $this->line('To restore it: php artisan backup:recover --password=… then use the UI, or restore that file manually.');
            }
        }

        $this->line('Details: storage/logs/backup.log');

        return self::SUCCESS;
    }
}
