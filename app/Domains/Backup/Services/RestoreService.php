<?php

namespace App\Domains\Backup\Services;

use App\Domains\Backup\Support\BackupCipher;
use App\Domains\Backup\Support\BackupManifest;
use App\Domains\Backup\Support\SqlSanitizer;
use App\Domains\Backup\Support\SqlSplitter;
use App\Models\Backup;
use App\Models\RestoreRun;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;
use ZipArchive;

class RestoreService
{
    public function __construct(
        private readonly BackupVerifier $verifier,
        private readonly BackupService $backupService,
        private readonly BackupCipher $cipher,
    ) {
    }

    public function inspectUpload(UploadedFile $file, ?string $password, ?int $userId): RestoreRun
    {
        $uuid = (string) Str::uuid();
        $path = 'uploads/'.$uuid.'.invbak';

        Storage::disk(config('backup.disk'))->putFileAs('uploads', $file, $uuid.'.invbak');

        try {
            return $this->inspectPath(
                Storage::disk(config('backup.disk'))->path($path),
                $file->getClientOriginalName(),
                'upload',
                $password,
                $userId,
                null,
                $path
            );
        } catch (Throwable $e) {
            Storage::disk(config('backup.disk'))->delete($path);
            throw $e;
        }
    }

    public function inspectBackup(Backup $backup, ?string $password, ?int $userId): RestoreRun
    {
        if (! $backup->isDownloadable()) {
            throw new RuntimeException('Only completed backups can be restored.');
        }

        return $this->inspectPath(
            Storage::disk($backup->disk)->path($backup->path),
            $backup->filename,
            'local',
            $password,
            $userId,
            $backup->id,
            null
        );
    }

    private function inspectPath(
        string $absolutePath,
        string $artifactName,
        string $source,
        ?string $password,
        ?int $userId,
        ?int $backupId,
        ?string $storedPath,
    ): RestoreRun {
        if (! is_file($absolutePath)) {
            throw new RuntimeException('The backup file could not be found.');
        }

        $size = (int) filesize($absolutePath);
        if ($size > (int) config('backup.max_restore_bytes', 1024 * 1024 * 1024)) {
            throw new RuntimeException('This backup exceeds the restore size limit.');
        }

        $encrypted = BackupCipher::isEncrypted($absolutePath);
        $zipPath = $absolutePath;
        $temporary = null;

        try {
            if ($encrypted) {
                if (! $password) {
                    throw new RuntimeException('This backup is password protected. Enter the password to continue.');
                }

                $temporary = $this->verifier->temporaryPath('zip');
                $this->cipher->decryptFile($absolutePath, $temporary, $password);
                $zipPath = $temporary;
            }

            $archive = $this->verifier->inspectArchive($zipPath);
            $manifest = $archive['manifest'];
            $warnings = [];

            if (($manifest['schema_version'] ?? 0) > $this->schemaVersion()) {
                throw new RuntimeException('This backup was created by a newer schema version and cannot be restored here.');
            }

            if (($manifest['app_version'] ?? null) !== app()->version()) {
                $warnings[] = 'Backup was created with Laravel '.($manifest['app_version'] ?? 'unknown').' (current: '.app()->version().').';
            }

            $businessName = (string) (app(\App\Domains\Settings\Services\SettingService::class)->get()['business']['business_name'] ?? '');
            $confirmation = $businessName !== '' ? $businessName : basename($artifactName);

            $preview = [
                'artifact' => $artifactName,
                'source' => $source,
                'format' => $manifest['format'],
                'created_at' => $manifest['created_at'] ?? null,
                'app_version' => $manifest['app_version'] ?? null,
                'schema_version' => $manifest['schema_version'] ?? null,
                'encrypted' => $encrypted,
                'size_bytes' => $size,
                'table_count' => count($manifest['database']['tables'] ?? []),
                'row_count' => array_sum($manifest['database']['tables'] ?? []),
                'file_count' => (int) ($archive['files'] ?? 0),
                'pending_jobs' => (int) ($manifest['database']['pending_jobs'] ?? 0),
                'excluded_tables' => $manifest['database']['excluded'] ?? [],
                'warnings' => $warnings,
                'confirmation_phrase' => $confirmation,
            ];

            return RestoreRun::create([
                'uuid' => (string) Str::uuid(),
                'backup_id' => $backupId,
                'source' => $source,
                'status' => RestoreRun::STATUS_READY,
                'artifact_path' => $storedPath ?? $backupId,
                'artifact_name' => $artifactName,
                'size_bytes' => $size,
                'password_protected' => $encrypted,
                'preview' => $preview,
                'confirmation_phrase' => $confirmation,
                'started_by' => $userId,
            ]);
        } finally {
            if ($temporary && is_file($temporary)) {
                @unlink($temporary);
            }
        }
    }

    public function restore(RestoreRun $run, string $confirmation, ?string $password, bool $force = false): RestoreRun
    {
        @set_time_limit(0);
        ignore_user_abort(true);

        if ($run->status !== RestoreRun::STATUS_READY) {
            throw new RuntimeException('This restore is no longer pending confirmation.');
        }

        if (trim($confirmation) !== (string) $run->confirmation_phrase) {
            throw new RuntimeException('The confirmation text does not match. Type it exactly to continue.');
        }

        if (! $force && $this->pendingJobs() > 0) {
            throw new RuntimeException('There are queued jobs waiting. Run the queue or choose "force" to discard them deliberately.');
        }

        $lock = Cache::lock('invenos:backup:restore', 3600);

        if (! $lock->get()) {
            throw new RuntimeException('Another restore is already running.');
        }

        $workDir = null;
        $maintenance = false;
        $manifest = null;

        try {
            $this->log("restore #{$run->id} starting ({$run->source})");
            $run->forceFill(['status' => RestoreRun::STATUS_RUNNING, 'started_at' => now()])->save();

            $artifactPath = $this->resolveArtifactPath($run);
            $encrypted = BackupCipher::isEncrypted($artifactPath);
            $zipPath = $artifactPath;
            $temporaryZip = null;

            if ($encrypted) {
                if (! $password) {
                    throw new RuntimeException('The backup password is required.');
                }

                $temporaryZip = $this->verifier->temporaryPath('zip');
                $this->cipher->decryptFile($artifactPath, $temporaryZip, $password);
                $zipPath = $temporaryZip;
            }

            $archive = $this->verifier->inspectArchive($zipPath);
            $manifest = $archive['manifest'];

            $workDir = $this->extract($zipPath);

            if ($temporaryZip && is_file($temporaryZip)) {
                @unlink($temporaryZip);
            }

            $safety = $this->backupService->create($password, $run->started_by, Backup::KIND_SAFETY);
            $run->forceFill(['safety_backup_id' => $safety->id])->save();
            $this->log("restore #{$run->id}: safety backup #{$safety->id} created");

            Artisan::call('down', ['--retry' => 60]);
            $maintenance = true;
            $this->log("restore #{$run->id}: maintenance mode enabled");

            $this->importDatabase($workDir.DIRECTORY_SEPARATOR.'database.sql');
            $this->log("restore #{$run->id}: database imported");

            $this->restoreFiles($workDir.DIRECTORY_SEPARATOR.'files');
            $this->log("restore #{$run->id}: files restored");

            $run->forceFill(['status' => RestoreRun::STATUS_VERIFYING])->save();
            $this->assertRestored($manifest);
            $this->log("restore #{$run->id}: counts verified");

            Artisan::call('migrate', ['--force' => true]);
            Artisan::call('optimize:clear');

            $this->invalidateSessions();

            Artisan::call('up');
            $maintenance = false;
            $this->log("restore #{$run->id}: completed");

            $run->forceFill([
                'status' => RestoreRun::STATUS_COMPLETED,
                'completed_at' => now(),
                'failure_reason' => null,
            ])->save();

            Storage::disk(config('backup.disk'))->delete('uploads/'.basename((string) $run->artifact_path));

            return $run->refresh();
        } catch (Throwable $e) {
            $run->forceFill([
                'status' => RestoreRun::STATUS_FAILED,
                'completed_at' => now(),
                'failure_reason' => Str::limit($e->getMessage(), 1000),
            ])->save();

            $this->log("restore #{$run->id} FAILED: ".$e->getMessage());

            // If the import failed before dropping rows, the live database is
            // still intact — do not leave the whole shop offline.
            if ($manifest !== null && $this->databaseLooksIntact($manifest) && file_exists(storage_path('framework/down'))) {
                Artisan::call('up');
                $maintenance = false;
                $this->log("restore #{$run->id}: database intact, maintenance mode disabled");
            }

            if ($workDir) {
                File::deleteDirectory($workDir);
            }

            throw $e;
        } finally {
            if ($workDir) {
                File::deleteDirectory($workDir);
            }

            if (! $maintenance && file_exists(storage_path('framework/down'))) {
                Artisan::call('up');
            }

            $lock->release();
        }
    }

    private function resolveArtifactPath(RestoreRun $run): string
    {
        if ($run->backup_id) {
            $backup = Backup::findOrFail($run->backup_id);

            return Storage::disk($backup->disk)->path($backup->path);
        }

        $path = (string) $run->artifact_path;

        if (str_starts_with($path, 'uploads/')) {
            return Storage::disk(config('backup.disk'))->path($path);
        }

        return $path;
    }

    private function extract(string $zipPath): string
    {
        $dir = rtrim(config('backup.work_dir'), '/\\').DIRECTORY_SEPARATOR.'restore-'.Str::uuid();
        if (! mkdir($dir, 0755, true) && ! is_dir($dir)) {
            throw new RuntimeException('Unable to create the restore workspace.');
        }

        $zip = new ZipArchive();
        if ($zip->open($zipPath) !== true) {
            throw new RuntimeException('Backup archive cannot be opened.');
        }

        try {
            if (! $zip->extractTo($dir)) {
                throw new RuntimeException('Backup archive could not be extracted.');
            }
        } finally {
            $zip->close();
        }

        return $dir;
    }

    private function importDatabase(string $sqlPath): void
    {
        if (! is_file($sqlPath)) {
            throw new RuntimeException('Backup does not contain a database dump.');
        }

        $sanitized = $this->verifier->temporaryPath('sql');

        try {
            $skipped = SqlSanitizer::sanitize($sqlPath, $sanitized);
            $this->log("sanitised dump: {$skipped} GTID/session line(s) skipped");

            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            DB::statement('SET UNIQUE_CHECKS=0');

            try {
                if (! $this->tryMysqlCli($sanitized)) {
                    $this->importWithPhp($sanitized);
                }
            } finally {
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
                DB::statement('SET UNIQUE_CHECKS=1');
            }
        } finally {
            if (is_file($sanitized)) {
                @unlink($sanitized);
            }
        }
    }

    private function databaseLooksIntact(array $manifest): bool
    {
        foreach (($manifest['database']['tables'] ?? []) as $table => $expected) {
            try {
                if ((int) DB::table($table)->count() < (int) $expected) {
                    return false;
                }
            } catch (Throwable) {
                return false;
            }
        }

        return true;
    }

    private function log(string $message): void
    {
        try {
            @file_put_contents(
                storage_path('logs/backup.log'),
                '['.now()->toDateTimeString().'] '.$message.PHP_EOL,
                FILE_APPEND | LOCK_EX
            );
        } catch (Throwable) {
        }
    }

    private function tryMysqlCli(string $sqlPath): bool
    {
        $binary = (string) config('backup.mysql_binary', '');
        if ($binary === '') {
            return false;
        }

        $db = config('database.connections.mysql');
        $args = [
            $binary,
            '--host='.($db['host'] ?? '127.0.0.1'),
            '--port='.($db['port'] ?? '3306'),
            '--user='.($db['username'] ?? ''),
            '--default-character-set=utf8mb4',
            (string) ($db['database'] ?? ''),
        ];

        $nullDevice = DIRECTORY_SEPARATOR === '\\' ? 'NUL' : '/dev/null';
        $errorPath = $sqlPath.'.import.err';

        $descriptors = [
            0 => ['file', $sqlPath, 'r'],
            1 => ['file', $nullDevice, 'w'],
            2 => ['file', $errorPath, 'w'],
        ];

        $process = @proc_open($args, $descriptors, $pipes, base_path(), [
            'MYSQL_PWD' => (string) ($db['password'] ?? ''),
            'PATH' => (string) (getenv('PATH') ?: ''),
            'SystemRoot' => (string) (getenv('SystemRoot') ?: ''),
        ]);

        if (! is_resource($process)) {
            @unlink($errorPath);

            return false;
        }

        $exitCode = proc_close($process);
        $error = is_file($errorPath) ? trim((string) file_get_contents($errorPath)) : '';
        @unlink($errorPath);

        if ($exitCode === 127) {
            return false;
        }

        if ($exitCode !== 0) {
            throw new RuntimeException('Database import failed: '.Str::limit($error ?: 'mysql exited with code '.$exitCode, 500));
        }

        return true;
    }

    private function importWithPhp(string $sqlPath): void
    {
        $sql = file_get_contents($sqlPath);
        if ($sql === false) {
            throw new RuntimeException('Unable to read the database dump.');
        }

        $statements = SqlSplitter::split($sql);
        $index = 0;

        foreach ($statements as $statement) {
            $index++;

            $probe = preg_replace('~/\*.*?\*/~s', '', $statement) ?? '';
            $probe = preg_replace('~^\s*(?:--[^\n]*|#[^\n]*)$~m', '', $probe) ?? '';

            if (trim($probe) === '') {
                continue;
            }

            try {
                DB::unprepared($statement);
            } catch (Throwable $e) {
                throw new RuntimeException("Database import failed at statement {$index}: ".Str::limit($e->getMessage(), 500));
            }
        }
    }

    private function restoreFiles(string $sourceDir): void
    {
        if (! is_dir($sourceDir)) {
            return;
        }

        foreach (config('backup.file_sources', []) as $prefix => $targetDir) {
            $from = $sourceDir.DIRECTORY_SEPARATOR.$prefix;
            if (! is_dir($from)) {
                continue;
            }

            $this->copyDirectory($from, $targetDir);
        }
    }

    private function copyDirectory(string $from, string $to): void
    {
        if (! is_dir($to) && ! mkdir($to, 0755, true) && ! is_dir($to)) {
            throw new RuntimeException("Unable to create restore directory: {$to}");
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($from, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $item) {
            $relative = substr($item->getPathname(), strlen($from) + 1);
            $destination = $to.DIRECTORY_SEPARATOR.$relative;

            if ($item->isDir()) {
                if (! is_dir($destination)) {
                    mkdir($destination, 0755, true);
                }
                continue;
            }

            if (! is_dir(dirname($destination))) {
                mkdir(dirname($destination), 0755, true);
            }

            if (! copy($item->getPathname(), $destination)) {
                throw new RuntimeException("Unable to restore file: {$relative}");
            }
        }
    }

    private function assertRestored(array $manifest): void
    {
        $problems = [];

        foreach (($manifest['database']['tables'] ?? []) as $table => $expected) {
            try {
                $actual = (int) DB::table($table)->count();
            } catch (Throwable) {
                $problems[] = "missing table {$table}";
                continue;
            }

            if ($actual < (int) $expected) {
                $problems[] = "{$table}: expected {$expected}, found {$actual}";
            }
        }

        if ($problems !== []) {
            throw new RuntimeException('Restore verification failed: '.implode('; ', $problems));
        }
    }

    private function invalidateSessions(): void
    {
        try {
            DB::table('sessions')->delete();
        } catch (Throwable) {
        }

        try {
            DB::table('users')->update(['remember_token' => null]);
        } catch (Throwable) {
        }
    }

    private function pendingJobs(): int
    {
        try {
            return (int) DB::table('jobs')->count();
        } catch (Throwable) {
            return 0;
        }
    }

    private function schemaVersion(): int
    {
        try {
            return (int) DB::table('migrations')->count();
        } catch (Throwable) {
            return 0;
        }
    }
}
