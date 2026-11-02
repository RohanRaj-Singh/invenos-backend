<?php

namespace App\Domains\Backup\Support;

final class SqlSanitizer
{
    /**
     * Strip server-specific statements that break portable imports
     * (notably GTID_PURGED on MySQL 8).
     *
     * @return int number of skipped lines
     */
    public static function sanitize(string $source, string $destination): int
    {
        $in = fopen($source, 'rb');
        $out = fopen($destination, 'wb');

        if (! $in || ! $out) {
            throw new \RuntimeException('Unable to open the database dump for sanitising.');
        }

        $patterns = [
            '/^\s*SET\s+@@(?:GLOBAL|SESSION)\.GTID_PURGED\b/i',
            '/^\s*SET\s+@@(?:GLOBAL|SESSION)\.SQL_LOG_BIN\b/i',
            '/^\s*SET\s+@MYSQLDUMP_TEMP_LOG_BIN\b/i',
            '/^\s*SET\s+@@SESSION\.GTID_NEXT\b/i',
        ];

        $skipped = 0;

        try {
            while (($line = fgets($in)) !== false) {
                foreach ($patterns as $pattern) {
                    if (preg_match($pattern, $line)) {
                        $skipped++;
                        continue 2;
                    }
                }

                fwrite($out, $line);
            }
        } finally {
            fclose($in);
            fclose($out);
        }

        return $skipped;
    }
}
