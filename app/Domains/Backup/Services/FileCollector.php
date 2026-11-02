<?php

namespace App\Domains\Backup\Services;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;

class FileCollector
{
    /**
     * Copy configured file sources into the staging directory.
     *
     * @return array<int, array{path: string, size: int, sha256: string}>
     */
    public function collect(string $stagingDir): array
    {
        $manifest = [];
        $sources = config('backup.file_sources', []);

        foreach ($sources as $prefix => $sourceDir) {
            if (! is_dir($sourceDir)) {
                continue;
            }

            $targetDir = $stagingDir.DIRECTORY_SEPARATOR.$prefix;
            $this->ensureDirectory($targetDir);

            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($sourceDir, RecursiveDirectoryIterator::SKIP_DOTS),
                RecursiveIteratorIterator::SELF_FIRST
            );

            foreach ($iterator as $item) {
                if ($item->isLink() || ! $item->isFile()) {
                    continue;
                }

                $relative = str_replace('\\', '/', substr($item->getPathname(), strlen($sourceDir) + 1));
                $destination = $targetDir.DIRECTORY_SEPARATOR.$relative;
                $this->ensureDirectory(dirname($destination));

                if (! copy($item->getPathname(), $destination)) {
                    throw new RuntimeException("Unable to copy {$item->getPathname()} into the backup.");
                }

                $hash = hash_file('sha256', $destination);

                $manifest[] = [
                    'path' => $prefix.'/'.$relative,
                    'size' => (int) filesize($destination),
                    'sha256' => (string) $hash,
                ];
            }
        }

        return $manifest;
    }

    private function ensureDirectory(string $path): void
    {
        if (! is_dir($path) && ! mkdir($path, 0755, true) && ! is_dir($path)) {
            throw new RuntimeException("Unable to create directory: {$path}");
        }
    }
}
