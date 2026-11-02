<?php

namespace Tests\Feature\Backup;

use App\Domains\Backup\Services\BackupService;
use App\Models\Backup;
use App\Models\RestoreRun;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BackupHttpTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('backups');
        config([
            'backup.dump_binary' => '',
            'backup.mysql_binary' => '',
            'backup.file_sources' => [],
        ]);
    }

    public function test_non_admins_cannot_manage_backups(): void
    {
        $user = $this->user('salesman');
        $backup = $this->completedBackup();

        $this->actingAs($user)->get('/settings/backup')->assertForbidden();
        $this->actingAs($user)->post('/settings/backup')->assertForbidden();
        $this->actingAs($user)->get("/settings/backup/{$backup->id}/download")->assertForbidden();
        $this->actingAs($user)->delete("/settings/backup/{$backup->id}")->assertForbidden();
    }

    public function test_admin_can_view_the_backup_page(): void
    {
        $this->completedBackup();

        $this->actingAs($this->user('admin'))
            ->get('/settings/backup')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/BackupRestore')
                ->has('backups.data', 1)
                ->has('restorableBackups', 1)
                ->where('stats.total', 1));
    }

    public function test_admin_can_download_a_verified_backup(): void
    {
        $backup = $this->completedBackup();

        $response = $this->actingAs($this->user('admin'))
            ->get("/settings/backup/{$backup->id}/download");

        $response->assertOk();
        $response->assertHeader('content-disposition');
    }

    public function test_incomplete_backups_cannot_be_downloaded(): void
    {
        $backup = $this->completedBackup(Backup::STATUS_FAILED);

        $this->actingAs($this->user('admin'))
            ->get("/settings/backup/{$backup->id}/download")
            ->assertNotFound();
    }

    public function test_newest_verified_backup_requires_force_to_delete(): void
    {
        $backup = $this->completedBackup();

        $this->actingAs($this->user('admin'))
            ->delete("/settings/backup/{$backup->id}")
            ->assertRedirect();

        $this->assertNotSoftDeleted($backup);

        $this->actingAs($this->user('admin'))
            ->delete("/settings/backup/{$backup->id}", ['force' => true])
            ->assertRedirect();

        $this->assertSoftDeleted($backup);
    }

    public function test_verify_endpoint_promotes_a_completed_backup(): void
    {
        $backup = $this->completedBackup(Backup::STATUS_COMPLETED);

        $this->actingAs($this->user('admin'))
            ->post("/settings/backup/{$backup->id}/verify")
            ->assertRedirect();

        $this->assertSame(Backup::STATUS_VERIFIED, $backup->refresh()->status);
    }

    public function test_uploaded_backup_is_inspected_without_touching_data(): void
    {
        $backup = $this->completedBackup();
        $contents = Storage::disk('backups')->get($backup->path);

        $response = $this->actingAs($this->user('admin'))
            ->post('/settings/backup/inspect', [
                'file' => UploadedFile::fake()->createWithContent('upload.invbak', $contents),
            ]);

        $response->assertRedirect();
        $this->assertSame(1, RestoreRun::query()->count());
        $this->assertSame(RestoreRun::STATUS_READY, RestoreRun::first()->status);
    }

    public function test_a_tampered_upload_is_rejected_before_a_restore_run_exists(): void
    {
        $backup = $this->completedBackup();
        $bytes = Storage::disk('backups')->get($backup->path);
        $bytes[200] = chr(ord($bytes[200]) ^ 0xFF);

        $this->actingAs($this->user('admin'))
            ->post('/settings/backup/inspect', [
                'file' => UploadedFile::fake()->createWithContent('tampered.invbak', $bytes),
            ])
            ->assertSessionHasErrors();

        $this->assertSame(0, RestoreRun::query()->count());
    }

    private function completedBackup(string $status = Backup::STATUS_VERIFIED): Backup
    {
        if ($status === Backup::STATUS_VERIFIED) {
            return app(BackupService::class)->create(null, $this->user('admin')->id);
        }

        $backup = app(BackupService::class)->create(null, $this->user('admin')->id);
        $backup->forceFill(['status' => $status])->save();

        return $backup->refresh();
    }

    private function user(string $role): User
    {
        return User::firstOrCreate(
            ['username' => $role.'-'.strtolower($role)],
            [
                'name' => ucfirst($role),
                'email' => $role.'@backup.test',
                'password' => bcrypt('secret'),
                'role' => $role,
                'active' => true,
            ]
        );
    }
}
