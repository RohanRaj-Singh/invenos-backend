<?php

namespace App\Domains\Backup\Services;

use App\Domains\Backup\Support\BackupCipher;
use App\Domains\Backup\Support\BackupManifest;
use App\Models\Backup;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;
use ZipArchive;

class BackupService
{
    public function __construct(
        private readonly DatabaseExporter $exporter,
        private readonly FileCollector $files,
        private readonly BackupVerifier $verifier,
    ) {
    }

    public function create(?string $password, ?int $userId, string $kind = Backup::KIND_MANUAL): Backup
    {
        @set_time_limit(0);
        ignore_user_abort(true);

        $lock = Cache::lock('invenos:backup:create', 3600);

        if (! $lock->get()) {
            throw new RuntimeException('A backup is already running. Try again in a moment.');
        }

        try {
            $this->cleanupStaleWork();

            $window = (int) config('backup.duplicate_window_seconds', 30);

            if ($window > 0 && in_array($kind, [Backup::KIND_MANUAL, Backup::KIND_SCHEDULED], true)) {
                $existing = Backup::query()
                    ->where('status', Backup::STATUS_VERIFIED)
                    ->where('kind', $kind)
                    ->where('created_at', '>=', now()->subSeconds($window))
                    ->latest('id')
                    ->first();

                if ($existing) {
                    return $existing;
                }
            }

            return $this->run($password, $userId, $kind);
        } finally {
            $lock->release();
        }
    }

    private function run(?string $password, ?int $userId, string $kind): Backup
    {
        $uuid = (string) Str::uuid();
        $timestamp = now();
        $filename = 'backup-'.$timestamp->format('Ymd-His').'-'.substr($uuid, 0, 8).'.invbak';
        $relativePath = $timestamp->format('Y/m').'/'.$filename;

        $backup = Backup::create([
            'uuid' => $uuid,
            'filename' => $filename,
            'disk' => config('backup.disk', 'backups'),
            'path' => $relativePath,
            'status' => Backup::STATUS_PENDING,
            'format_version' => (int) config('backup.format_version', 1),
            'app_version' => app()->version(),
            'encrypted' => $password !== null && $password !== '',
            'password_protected' => $password !== null && $password !== '',
            'kind' => $kind,
            'created_by' => $userId,
        ]);

        $workDir = rtrim(config('backup.work_dir'), '/\\').DIRECTORY_SEPARATOR.$uuid;

        try {
            $backup->forceFill([
                'status' => Backup::STATUS_RUNNING,
                'started_at' => now(),
            ])->save();

            $this->ensureDirectory($workDir);

            $databasePath = $workDir.DIRECTORY_SEPARATOR.BackupManifest::DATABASE_FILE;
            $dump = $this->exporter->dump($databasePath);

            $stagingFiles = $workDir.DIRECTORY_SEPARATOR.'files';
            $this->ensureDirectory($stagingFiles);
            $manifestFiles = $this->files->collect($stagingFiles);

            $manifest = [
                'format' => (int) config('backup.format_version', 1),
                'created_at' => now()->toIso8601String(),
                'app_version' => app()->version(),
                'php_version' => PHP_VERSION,
                'schema_version' => $this->schemaVersion(),
                'kind' => $kind,
                'encrypted' => $backup->encrypted,
                'database' => $dump,
                'files' => $manifestFiles,
            ];

            $manifestPath = $workDir.DIRECTORY_SEPARATOR.BackupManifest::FILE;
            File::put($manifestPath, BackupManifest::build($manifest));

            $zipPath = $workDir.DIRECTORY_SEPARATOR.'artifact.zip';
            $this->writeZip($zipPath, $manifestPath, $databasePath, $stagingFiles, $manifestFiles);

            $this->verifier->inspectArchive($zipPath);

            $artifactPath = $zipPath;

            if ($backup->encrypted) {
                $artifactPath = $workDir.DIRECTORY_SEPARATOR.'artifact.invbak';
                (new BackupCipher())->encryptFile($zipPath, $artifactPath, (string) $password);
            }

            $stream = fopen($artifactPath, 'rb');
            if (! $stream) {
                throw new RuntimeException('Unable to read the completed backup artifact.');
            }

            try {
                Storage::disk($backup->disk)->writeStream($relativePath, $stream);
            } finally {
                fclose($stream);
            }

            $storedPath = Storage::disk($backup->disk)->path($relativePath);
            clearstatcache(true, $storedPath);

            $backup->forceFill([
                'status' => Backup::STATUS_VERIFIED,
                'size_bytes' => (int) filesize($storedPath),
                'sha256' => (string) hash_file('sha256', $storedPath),
                'schema_version' => $manifest['schema_version'],
                'included_scope' => [
                    'database' => true,
                    'prescriptions' => count(array_filter($manifestFiles, fn ($f) => str_starts_with($f['path'], 'prescriptions/'))),
                    'logos' => count(array_filter($manifestFiles, fn ($f) => str_starts_with($f['path'], 'logos/'))),
                    'excluded_tables' => $dump['excluded'],
                ],
                'table_counts' => $dump['tables'],
                'pending_jobs' => $dump['pending_jobs'],
                'completed_at' => now(),
                'verified_at' => now(),
                'failure_reason' => null,
            ])->save();

            return $backup->refresh();
        } catch (Throwable $e) {
            $backup->forceFill([
                'status' => Backup::STATUS_FAILED,
                'failure_reason' => Str::limit($e->getMessage(), 1000),
                'completed_at' => now(),
            ])->save();

            throw $e;
        } finally {
            File::deleteDirectory($workDir);
        }
    }

    private function writeZip(string $zipPath, string $manifestPath, string $databasePath, string $stagingFiles, array $manifestFiles): void
    {
        $zip = new ZipArchive();

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('Unable to create the backup archive.');
        }

        try {
            $zip->addFile($manifestPath, BackupManifest::FILE);
            $zip->addFile($databasePath, BackupManifest::DATABASE_FILE);

            foreach ($manifestFiles as $entry) {
                $absolute = $stagingFiles.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $entry['path']);
                $zip->addFile($absolute, 'files/'.$entry['path']);
            }

            if (! $zip->close()) {
                throw new RuntimeException('Unable to finalise the backup archive.');
            }
        } catch (Throwable $e) {
            $zip->close();
            throw $e;
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

    private function ensureDirectory(string $path): void
    {
        if (! is_dir($path) && ! mkdir($path, 0755, true) && ! is_dir($path)) {
            throw new RuntimeException("Unable to create directory: {$path}");
        }
    }

    private function cleanupStaleWork(): void
    {
        $base = rtrim((string) config('backup.work_dir'), '/\\');

        if (! is_dir($base)) {
            return;
        }

        $cutoff = now()->subDay()->timestamp;

        foreach (glob($base.DIRECTORY_SEPARATOR.'*') ?: [] as $path) {
            if (is_file($path) && filemtime($path) < $cutoff) {
                @unlink($path);
            }

            if (is_dir($path) && filemtime($path) < $cutoff) {
                File::deleteDirectory($path);
            }
        }
    }
}
