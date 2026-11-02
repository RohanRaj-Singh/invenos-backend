<?php

namespace Tests\Feature\Backup;

use App\Domains\Settings\Services\SettingService;
use App\Models\Backup;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BackupScheduleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('backups');
        config(['backup.dump_binary' => '', 'backup.mysql_binary' => '', 'backup.file_sources' => []]);
    }

    public function test_disabled_automatic_backups_do_nothing(): void
    {
        $this->configure(['enabled' => false]);

        $this->artisan('backup:run --scheduled')->assertExitCode(0);

        $this->assertSame(0, Backup::query()->count());
    }

    public function test_a_period_that_already_ran_is_skipped(): void
    {
        $this->configure(['enabled' => true, 'time' => '00:00', 'timezone' => 'UTC', 'frequency' => 'daily']);

        $backup = Backup::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'filename' => 'scheduled-today.invbak',
            'disk' => 'backups',
            'path' => 'test/scheduled-today.invbak',
            'status' => Backup::STATUS_VERIFIED,
            'kind' => Backup::KIND_SCHEDULED,
            'encrypted' => false,
            'password_protected' => false,
        ]);
        $backup->forceFill(['created_at' => Carbon::now('UTC'), 'completed_at' => Carbon::now('UTC')])->save();

        $this->artisan('backup:run --scheduled')->assertExitCode(0);

        $this->assertSame(1, Backup::query()->where('kind', Backup::KIND_SCHEDULED)->count());
    }

    public function test_a_recent_backup_blocks_a_second_non_scheduled_run(): void
    {
        config([
            'backup.duplicate_window_seconds' => 0,
            'backup.cli_duplicate_window_minutes' => 5,
        ]);

        $this->seedBackup('recent-manual.invbak', now(), Backup::KIND_MANUAL, Backup::STATUS_VERIFIED);

        $this->artisan('backup:run')->assertExitCode(0);

        $this->assertSame(1, Backup::query()->count());
    }

    public function test_status_command_reports_history(): void
    {
        $this->seedBackup('status-check.invbak', now(), Backup::KIND_MANUAL, Backup::STATUS_VERIFIED);

        $this->artisan('backup:status')->assertExitCode(0);
    }

    private function seedBackup(string $filename, Carbon $createdAt, string $kind, string $status): Backup
    {
        $backup = Backup::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'filename' => $filename,
            'disk' => 'backups',
            'path' => 'test/'.$filename,
            'size_bytes' => 1024,
            'status' => $status,
            'kind' => $kind,
            'encrypted' => false,
            'password_protected' => false,
        ]);

        $backup->forceFill(['created_at' => $createdAt, 'completed_at' => $createdAt, 'verified_at' => $createdAt])->save();

        return $backup;
    }

    private function configure(array $backupSettings): void
    {
        Setting::query()->delete();

        $defaults = app(SettingService::class)->defaults();
        $defaults['backup'] = array_merge($defaults['backup'], $backupSettings);

        Setting::create(['values' => $defaults]);
        Cache::forget('app_settings');
    }
}
