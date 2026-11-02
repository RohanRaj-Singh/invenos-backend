<?php

namespace Tests\Feature\Backup;

use App\Domains\Backup\Services\BackupService;
use App\Domains\Backup\Services\BackupVerifier;
use App\Models\Backup;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BackupServiceTest extends TestCase
{
    use RefreshDatabase;

    private string $sourceDir;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('backups');
        $this->sourceDir = storage_path('framework/testing/backup-src');

        config([
            'backup.dump_binary' => '',
            'backup.mysql_binary' => '',
            'backup.file_sources' => [
                'prescriptions' => $this->sourceDir.'/prescriptions',
                'logos' => $this->sourceDir.'/logos',
            ],
        ]);

        File::deleteDirectory($this->sourceDir);
        File::ensureDirectoryExists($this->sourceDir.'/prescriptions');
        File::ensureDirectoryExists($this->sourceDir.'/logos');
        File::put($this->sourceDir.'/prescriptions/scan.jpg', 'prescription-bytes');
        File::put($this->sourceDir.'/logos/brand.png', 'logo-bytes');
    }

    public function test_creates_a_verified_artifact_with_manifest_and_files(): void
    {
        $product = $this->product();

        $backup = app(BackupService::class)->create(null, $this->admin()->id);

        $this->assertSame(Backup::STATUS_VERIFIED, $backup->status);
        $this->assertNotNull($backup->verified_at);
        $this->assertNotNull($backup->sha256);
        $this->assertGreaterThan(0, $backup->size_bytes);
        $this->assertSame(2, $backup->included_scope['prescriptions'] + $backup->included_scope['logos']);
        $this->assertArrayHasKey('products', $backup->table_counts);

        $path = Storage::disk('backups')->path($backup->path);
        $this->assertFileExists($path);
        $this->assertSame($backup->sha256, hash_file('sha256', $path));

        $archive = app(BackupVerifier::class)->inspectArchive($path);
        $this->assertContains('prescriptions/scan.jpg', array_column($archive['manifest']['files'], 'path'));
        $this->assertContains('logos/brand.png', array_column($archive['manifest']['files'], 'path'));

        $zip = new \ZipArchive();
        $zip->open($path);
        $sql = $zip->getFromName('database.sql');
        $zip->close();

        $this->assertStringContainsString('CREATE TABLE `products`', $sql);
        $this->assertStringNotContainsString('CREATE TABLE `sessions`', $sql);
        $this->assertStringNotContainsString('CREATE TABLE `backups`', $sql);
        $this->assertStringNotContainsString('CREATE TABLE `jobs`', $sql);
    }

    public function test_encrypted_backup_requires_the_correct_password(): void
    {
        $backup = app(BackupService::class)->create('correct-password', $this->admin()->id);

        $this->assertTrue($backup->encrypted);
        $path = Storage::disk('backups')->path($backup->path);
        $this->assertSame("INVBAK\0", file_get_contents($path, false, null, 0, 7));

        $verifier = app(BackupVerifier::class);

        $good = $verifier->verify($backup, 'correct-password');
        $this->assertTrue($good['content_verified']);
        $this->assertSame([], $good['errors']);

        $bad = $verifier->verify($backup, 'wrong-password');
        $this->assertFalse($bad['content_verified']);
        $this->assertNotEmpty($bad['errors']);
    }

    public function test_a_failed_run_is_recorded_with_a_reason(): void
    {
        $blocked = storage_path('framework/testing/blocked-workdir');
        File::deleteDirectory($blocked);
        File::put($blocked, 'not a directory');
        config(['backup.work_dir' => $blocked]);

        try {
            app(BackupService::class)->create(null, $this->admin()->id);
            $this->fail('Expected the backup to fail.');
        } catch (\Throwable $e) {
            $this->assertNotSame('', $e->getMessage());
        }

        $backup = Backup::latest()->firstOrFail();
        $this->assertSame(Backup::STATUS_FAILED, $backup->status);
        $this->assertNotNull($backup->failure_reason);

        File::delete($blocked);
    }

    public function test_duplicate_backups_within_the_window_are_reused(): void
    {
        config(['backup.duplicate_window_seconds' => 60]);

        $admin = $this->admin();

        $first = app(BackupService::class)->create(null, $admin->id);
        $second = app(BackupService::class)->create(null, $admin->id);

        $this->assertSame($first->id, $second->id);
        $this->assertSame(1, Backup::query()->count());
    }

    public function test_pending_jobs_are_counted_and_excluded(): void
    {
        \Illuminate\Support\Facades\DB::table('jobs')->insert([
            'queue' => 'default',
            'payload' => json_encode(['job' => 'example']),
            'attempts' => 0,
            'reserved_at' => null,
            'available_at' => now()->timestamp,
            'created_at' => now()->timestamp,
        ]);

        $backup = app(BackupService::class)->create(null, $this->admin()->id);

        $this->assertSame(1, $backup->pending_jobs);
    }

    private function product(): Product
    {
        return Product::create([
            'name' => 'Backup Product',
            'sku' => 'BK-1',
            'base_unit_id' => 'piece',
            'track_inventory' => true,
            'stock_quantity' => 5,
            'status' => 'in-stock',
            'created_by' => 'test',
        ]);
    }

    private function admin(): User
    {
        return User::create([
            'name' => 'Admin',
            'username' => 'backup-admin',
            'email' => 'backup-admin@test.local',
            'password' => bcrypt('secret'),
            'role' => 'admin',
            'active' => true,
        ]);
    }
}
