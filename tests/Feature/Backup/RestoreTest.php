<?php

namespace Tests\Feature\Backup;

use App\Domains\Backup\Services\BackupService;
use App\Domains\Backup\Services\RestoreService;
use App\Models\Backup;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RestoreTest extends TestCase
{
    use DatabaseMigrations;

    private string $sourceDir;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('backups');
        $this->sourceDir = storage_path('framework/testing/restore-src');

        config([
            'backup.dump_binary' => '',
            'backup.mysql_binary' => '',
            'backup.work_dir' => storage_path('framework/testing/restore-work'),
            'backup.file_sources' => [
                'prescriptions' => $this->sourceDir.'/prescriptions',
                'logos' => $this->sourceDir.'/logos',
            ],
        ]);

        File::deleteDirectory($this->sourceDir);
        File::ensureDirectoryExists($this->sourceDir.'/prescriptions');
        File::put($this->sourceDir.'/prescriptions/visit.jpg', 'visit-bytes');
        File::deleteDirectory(storage_path('framework/testing/restore-work'));
    }

    public function test_restore_recreates_deleted_rows_and_files(): void
    {
        $product = $this->product('RESTORE-1');

        $backup = app(BackupService::class)->create(null, $this->admin()->id);

        Product::where('sku', 'RESTORE-1')->delete();
        File::delete($this->sourceDir.'/prescriptions/visit.jpg');
        DB::table('sessions')->insert([
            'id' => 'restore-test-session',
            'user_id' => null,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'test',
            'payload' => 'payload',
            'last_activity' => now()->timestamp,
        ]);

        $this->assertNull(Product::where('sku', 'RESTORE-1')->first());
        $this->assertFileDoesNotExist($this->sourceDir.'/prescriptions/visit.jpg');

        $run = app(RestoreService::class)->inspectBackup($backup, null, $this->admin()->id);
        $this->assertSame('ready', $run->status);

        app(RestoreService::class)->restore($run, 'Invenos', null);

        $restored = Product::withTrashed()->where('sku', 'RESTORE-1')->first();
        $this->assertNotNull($restored);
        $this->assertNull($restored->deleted_at);
        $this->assertSame($product->id, $restored->id);

        $this->assertFileExists($this->sourceDir.'/prescriptions/visit.jpg');
        $this->assertSame(0, DB::table('sessions')->count());
        $this->assertFalse(file_exists(storage_path('framework/down')));

        $this->assertSame('completed', $run->refresh()->status);
        $this->assertNotNull($run->safety_backup_id);
        $this->assertDatabaseHas('backups', [
            'id' => $run->safety_backup_id,
            'kind' => Backup::KIND_SAFETY,
        ]);
    }

    public function test_restore_requires_the_exact_confirmation_phrase(): void
    {
        $this->product('RESTORE-2');
        $backup = app(BackupService::class)->create(null, $this->admin()->id);
        $run = app(RestoreService::class)->inspectBackup($backup, null, $this->admin()->id);

        $this->expectExceptionMessage('confirmation text does not match');

        app(RestoreService::class)->restore($run, 'wrong phrase', null);
    }

    public function test_restore_is_blocked_by_pending_jobs_unless_forced(): void
    {
        $this->product('RESTORE-3');
        $backup = app(BackupService::class)->create(null, $this->admin()->id);
        $run = app(RestoreService::class)->inspectBackup($backup, null, $this->admin()->id);

        DB::table('jobs')->insert([
            'queue' => 'default',
            'payload' => json_encode(['job' => 'example']),
            'attempts' => 0,
            'reserved_at' => null,
            'available_at' => now()->timestamp,
            'created_at' => now()->timestamp,
        ]);

        $this->expectExceptionMessage('queued jobs waiting');

        app(RestoreService::class)->restore($run, 'Invenos', null);
    }

    public function test_encrypted_backup_requires_a_password_to_inspect(): void
    {
        $this->product('RESTORE-4');
        $backup = app(BackupService::class)->create('backup-secret', $this->admin()->id);

        $this->expectExceptionMessage('password protected');

        app(RestoreService::class)->inspectBackup($backup, null, $this->admin()->id);
    }

    private function product(string $sku): Product
    {
        return Product::create([
            'name' => 'Restorable '.$sku,
            'sku' => $sku,
            'base_unit_id' => 'piece',
            'track_inventory' => true,
            'stock_quantity' => 3,
            'status' => 'in-stock',
            'created_by' => 'test',
        ]);
    }

    private function admin(): User
    {
        return User::firstOrCreate(
            ['username' => 'restore-admin'],
            [
                'name' => 'Restore Admin',
                'email' => 'restore-admin@test.local',
                'password' => bcrypt('secret'),
                'role' => 'admin',
                'active' => true,
            ]
        );
    }
}
