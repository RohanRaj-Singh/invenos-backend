<?php

namespace Tests\Feature\Backup;

use App\Domains\Backup\Services\RetentionService;
use App\Models\Backup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RetentionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('backups');

        config([
            'backup.retention.daily' => 7,
            'backup.retention.weekly' => 4,
            'backup.retention.monthly' => 12,
            'backup.retention.safety' => 3,
        ]);
    }

    public function test_keeps_the_configured_daily_window_and_never_touches_manual_backups(): void
    {
        for ($day = 1; $day <= 10; $day++) {
            $this->backup(Carbon::parse('2026-10-'.str_pad((string) $day, 2, '0', STR_PAD_LEFT).' 02:00'), Backup::KIND_SCHEDULED);
        }

        for ($i = 1; $i <= 3; $i++) {
            $this->backup(Carbon::parse('2026-09-0'.$i.' 12:00'), Backup::KIND_MANUAL);
        }

        $result = app(RetentionService::class)->prune();

        $this->assertSame(3, $result['deleted']);
        $this->assertSame(7, Backup::query()->where('kind', Backup::KIND_SCHEDULED)->count());
        $this->assertSame(3, Backup::query()->where('kind', Backup::KIND_MANUAL)->count());
    }

    public function test_safety_backups_are_retained_separately(): void
    {
        for ($i = 1; $i <= 5; $i++) {
            $this->backup(Carbon::parse('2026-10-0'.$i.' 03:00'), Backup::KIND_SAFETY);
        }

        $result = app(RetentionService::class)->prune();

        $this->assertSame(2, $result['deleted']);
        $this->assertSame(3, Backup::query()->where('kind', Backup::KIND_SAFETY)->count());
    }

    public function test_the_newest_verified_backup_is_always_protected(): void
    {
        config(['backup.retention.daily' => 1]);

        $this->backup(Carbon::parse('2026-10-01 02:00'), Backup::KIND_SCHEDULED);
        $newest = $this->backup(Carbon::parse('2026-10-02 02:00'), Backup::KIND_SCHEDULED);

        app(RetentionService::class)->prune();

        $this->assertNotSoftDeleted($newest);
    }

    private function backup(Carbon $when, string $kind): Backup
    {
        $backup = Backup::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'filename' => 'backup-'.$when->format('Ymd-His').'-'.substr((string) \Illuminate\Support\Str::uuid(), 0, 8).'.invbak',
            'disk' => 'backups',
            'path' => 'test/'.$when->format('YmdHis').'-'.substr((string) \Illuminate\Support\Str::uuid(), 0, 6).'.invbak',
            'size_bytes' => 1024,
            'status' => Backup::STATUS_VERIFIED,
            'kind' => $kind,
            'encrypted' => false,
            'password_protected' => false,
        ]);

        $backup->forceFill([
            'created_at' => $when,
            'completed_at' => $when,
            'verified_at' => $when,
        ])->save();

        return $backup;
    }
}
