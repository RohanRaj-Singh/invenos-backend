<?php

namespace Tests\Feature\Backup;

use App\Models\RestoreRun;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class BackupRecoverTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        if (file_exists(storage_path('framework/down'))) {
            @unlink(storage_path('framework/down'));
        }

        parent::tearDown();
    }

    public function test_recover_disables_maintenance_and_closes_stale_runs(): void
    {
        Artisan::call('down');

        $run = RestoreRun::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'source' => 'upload',
            'status' => RestoreRun::STATUS_RUNNING,
            'artifact_name' => 'interrupted.invbak',
            'started_at' => now()->subMinutes(30),
        ]);

        $this->artisan('backup:recover --minutes=5')->assertExitCode(0);

        $this->assertFalse(file_exists(storage_path('framework/down')));
        $this->assertSame(RestoreRun::STATUS_FAILED, $run->refresh()->status);
        $this->assertSame('Restore was interrupted before it could finish.', $run->failure_reason);
    }

    public function test_recover_leaves_recent_runs_alone(): void
    {
        $run = RestoreRun::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'source' => 'upload',
            'status' => RestoreRun::STATUS_RUNNING,
            'artifact_name' => 'in-flight.invbak',
            'started_at' => now()->subMinute(),
        ]);

        $this->artisan('backup:recover --minutes=10')->assertExitCode(0);

        $this->assertSame(RestoreRun::STATUS_RUNNING, $run->refresh()->status);
    }
}
