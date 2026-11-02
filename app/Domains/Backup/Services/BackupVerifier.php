<?php

namespace App\Domains\Backup\Services;

use App\Domains\Backup\Support\BackupCipher;
use App\Domains\Backup\Support\BackupManifest;
use App\Models\Backup;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;
use ZipArchive;

class BackupVerifier
{
    /**
     * Verify a stored backup. Checksums are always checked; content is only
     * verified when the passphrase is available (or the file is unencrypted).
     *
     * @return array{checksum_ok: bool, content_verified: bool, manifest: ?array, errors: string[]}
     */
    public function verify(Backup $backup, ?string $password = null): array
    {
        $errors = [];
        $path = Storage::disk($backup->disk)->path($backup->path);

        if (! is_file($path)) {
            return ['checksum_ok' => false, 'content_verified' => false, 'manifest' => null, 'errors' => ['Backup file is missing.']];
        }

        clearstatcache(true, $path);
        $checksumOk = true;

        if ($backup->size_bytes !== null && (int) filesize($path) !== (int) $backup->size_bytes) {
            $errors[] = 'File size does not match the recorded size.';
            $checksumOk = false;
        }

        if ($backup->sha256 && ! hash_equals($backup->sha256, (string) hash_file('sha256', $path))) {
            $errors[] = 'File checksum does not match the recorded checksum.';
            $checksumOk = false;
        }

        $workPath = $path;

        try {
            if (BackupCipher::isEncrypted($path)) {
                if (! $password) {
                    return [
                        'checksum_ok' => $checksumOk,
                        'content_verified' => false,
                        'manifest' => null,
                        'errors' => array_merge($errors, ['A password is required to verify the contents of this backup.']),
                    ];
                }

                $workPath = $this->temporaryPath('invbak');
                (new BackupCipher())->decryptFile($path, $workPath, $password);
            }

            $result = $this->inspectArchive($workPath);

            return [
                'checksum_ok' => $checksumOk,
                'content_verified' => true,
                'manifest' => $result['manifest'],
                'errors' => $errors,
            ];
        } catch (Throwable $e) {
            return [
                'checksum_ok' => $checksumOk,
                'content_verified' => false,
                'manifest' => null,
                'errors' => array_merge($errors, [$e->getMessage()]),
            ];
        } finally {
            if ($workPath !== $path && is_file($workPath)) {
                @unlink($workPath);
            }
        }
    }

    /**
     * @return array{manifest: array, files: int}
     */
    public function inspectArchive(string $zipPath): array
    {
        $zip = new ZipArchive();

        if ($zip->open($zipPath) !== true) {
            throw new RuntimeException('Backup archive cannot be opened.');
        }

        try {
            $manifestJson = $zip->getFromName(BackupManifest::FILE);
            if ($manifestJson === false) {
                throw new RuntimeException('Backup archive is missing its manifest.');
            }

            $manifest = BackupManifest::parse($manifestJson);

            if ($zip->locateName(BackupManifest::DATABASE_FILE) === false) {
                throw new RuntimeException('Backup archive is missing the database dump.');
            }

            foreach ($manifest['files'] as $entry) {
                $name = 'files/'.$entry['path'];
                $stream = $zip->getStream($name);

                if (! $stream) {
                    throw new RuntimeException("Backup archive is missing {$entry['path']}.");
                }

                $context = hash_init('sha256');
                hash_update_stream($context, $stream);
                fclose($stream);

                if (! hash_equals((string) $entry['sha256'], hash_final($context))) {
                    throw new RuntimeException("Backup file {$entry['path']} failed its integrity check.");
                }
            }

            return ['manifest' => $manifest, 'files' => count($manifest['files'])];
        } finally {
            $zip->close();
        }
    }

    public function temporaryPath(string $extension): string
    {
        $dir = rtrim(config('backup.work_dir'), '/\\');
        if (! is_dir($dir) && ! mkdir($dir, 0755, true) && ! is_dir($dir)) {
            throw new RuntimeException('Unable to create the backup work directory.');
        }

        return $dir.DIRECTORY_SEPARATOR.'tmp-'.bin2hex(random_bytes(8)).'.'.$extension;
    }
}
