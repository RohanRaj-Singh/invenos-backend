<?php

namespace App\Domains\Backup\Support;

use RuntimeException;

final class BackupManifest
{
    public const FILE = 'manifest.json';
    public const DATABASE_FILE = 'database.sql';

    public static function build(array $data): string
    {
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        if ($json === false) {
            throw new RuntimeException('Unable to encode the backup manifest.');
        }

        return $json;
    }

    public static function parse(string $json): array
    {
        $data = json_decode($json, true);

        if (! is_array($data)) {
            throw new RuntimeException('Backup manifest is not valid JSON.');
        }

        if (($data['format'] ?? null) !== config('backup.format_version', 1)) {
            throw new RuntimeException('Backup manifest format is not supported.');
        }

        if (! is_array($data['database']['tables'] ?? null)) {
            throw new RuntimeException('Backup manifest is missing database table metadata.');
        }

        if (! is_array($data['files'] ?? null)) {
            throw new RuntimeException('Backup manifest is missing the file list.');
        }

        return $data;
    }
}
