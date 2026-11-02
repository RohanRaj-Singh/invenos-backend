<?php

namespace App\Domains\Backup\Services;

use Illuminate\Support\Facades\DB;
use RuntimeException;

class DatabaseExporter
{
    /**
     * Dump the application database to $path.
     *
     * @return array{tables: array<string,int>, excluded: string[], pending_jobs: int, exporter: string, driver: string}
     */
    public function dump(string $path): array
    {
        $connection = config('database.default');
        $driver = DB::connection($connection)->getDriverName();

        if ($driver !== 'mysql') {
            throw new RuntimeException("Backup supports MySQL connections only; {$driver} given.");
        }

        $excluded = config('backup.exclude_tables', []);
        $tables = $this->tableCounts($excluded);
        $pendingJobs = $this->pendingJobs();

        $exporter = 'php';

        if ($this->tryMysqldump($path, $excluded)) {
            $exporter = 'mysqldump';
        } else {
            $this->phpDump($path, $excluded);
        }

        clearstatcache(true, $path);
        if (! is_file($path) || filesize($path) < 100) {
            throw new RuntimeException('The database export produced an empty file.');
        }

        return [
            'tables' => $tables,
            'excluded' => $excluded,
            'pending_jobs' => $pendingJobs,
            'exporter' => $exporter,
            'driver' => $driver,
        ];
    }

    private function tableCounts(array $excluded): array
    {
        $counts = [];

        foreach ($this->baseTables() as $table) {
            if (in_array($table, $excluded, true)) {
                continue;
            }

            $counts[$table] = (int) DB::table($table)->count();
        }

        return $counts;
    }

    private function pendingJobs(): int
    {
        try {
            return (int) DB::table('jobs')->count();
        } catch (\Throwable) {
            return 0;
        }
    }

    private function isMariaDb(): bool
    {
        try {
            $version = (string) (DB::selectOne('select version() as version')->version ?? '');

            return stripos($version, 'mariadb') !== false;
        } catch (\Throwable) {
            return false;
        }
    }

    private function tryMysqldump(string $path, array $excluded): bool
    {
        $binary = (string) config('backup.dump_binary', '');
        if ($binary === '') {
            return false;
        }

        $db = config('database.connections.mysql');
        $database = $db['database'] ?? '';

        $args = [
            $binary,
            '--host='.($db['host'] ?? '127.0.0.1'),
            '--port='.($db['port'] ?? '3306'),
            '--user='.($db['username'] ?? ''),
            '--single-transaction',
            '--quick',
            '--skip-lock-tables',
            '--no-tablespaces',
            '--default-character-set=utf8mb4',
        ];

        // MySQL 8 emits SET @@GLOBAL.GTID_PURGED, which fails on import when
        // GTIDs are enabled. MariaDB's mysqldump does not accept this flag.
        if (! $this->isMariaDb()) {
            $args[] = '--set-gtid-purged=OFF';
        }

        $args[] = $database;

        foreach ($excluded as $table) {
            $args[] = '--ignore-table='.$database.'.'.$table;
        }

        $nullDevice = DIRECTORY_SEPARATOR === '\\' ? 'NUL' : '/dev/null';
        $errorPath = $path.'.err';

        $descriptors = [
            0 => ['file', $nullDevice, 'r'],
            1 => ['file', $path, 'w'],
            2 => ['file', $errorPath, 'w'],
        ];

        $process = @proc_open($args, $descriptors, $pipes, base_path(), $this->processEnv());

        if (! is_resource($process)) {
            @unlink($errorPath);

            return false;
        }

        $exitCode = proc_close($process);
        $error = is_file($errorPath) ? trim((string) file_get_contents($errorPath)) : '';
        @unlink($errorPath);

        clearstatcache(true, $path);

        if ($exitCode !== 0 || ! is_file($path) || filesize($path) < 100) {
            @unlink($path);

            return false;
        }

        if ($error !== '' && stripos($error, 'warning') === false) {
            @unlink($path);

            return false;
        }

        return true;
    }

    private function processEnv(): array
    {
        return [
            'MYSQL_PWD' => (string) config('database.connections.mysql.password', ''),
            'PATH' => (string) (getenv('PATH') ?: ''),
            'SystemRoot' => (string) (getenv('SystemRoot') ?: ''),
            'TMPDIR' => (string) sys_get_temp_dir(),
            'TMP' => (string) sys_get_temp_dir(),
        ];
    }

    private function phpDump(string $path, array $excluded): void
    {
        $handle = fopen($path, 'wb');
        if (! $handle) {
            throw new RuntimeException('Unable to write the database export.');
        }

        $pdo = DB::connection()->getPdo();

        try {
            fwrite($handle, "SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\nSET UNIQUE_CHECKS=0;\nSET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';\n\n");

            foreach ($this->baseTables() as $table) {
                if (in_array($table, $excluded, true)) {
                    continue;
                }

                $quotedTable = $this->quoteIdentifier($table);
                $create = DB::select("SHOW CREATE TABLE {$quotedTable}");
                $createSql = array_values((array) $create[0])[1] ?? null;

                if (! $createSql) {
                    continue;
                }

                fwrite($handle, "DROP TABLE IF EXISTS {$quotedTable};\n{$createSql};\n\n");

                $this->writeRows($handle, $pdo, $table);
                fwrite($handle, "\n");
            }

            fwrite($handle, "SET UNIQUE_CHECKS=1;\nSET FOREIGN_KEY_CHECKS=1;\n");
        } finally {
            fclose($handle);
        }
    }

    private function writeRows($handle, \PDO $pdo, string $table): void
    {
        $quotedTable = $this->quoteIdentifier($table);
        $primaryKey = $this->primaryKey($table);
        $chunkSize = 500;
        $batch = [];
        $batchBytes = 0;
        $columns = null;

        $writeBatch = function () use (&$batch, &$batchBytes, $handle, $pdo, $quotedTable, &$columns): void {
            if ($batch === []) {
                return;
            }

            if ($columns === null) {
                $columns = array_keys((array) $batch[0]);
            }

            $columnList = implode(',', array_map([$this, 'quoteIdentifier'], $columns));
            $values = [];

            foreach ($batch as $row) {
                $encoded = [];
                foreach ((array) $row as $value) {
                    $encoded[] = $this->encodeValue($pdo, $value);
                }
                $values[] = '('.implode(',', $encoded).')';
            }

            fwrite($handle, "INSERT INTO {$quotedTable} ({$columnList}) VALUES\n".implode(",\n", $values).";\n");
            $batch = [];
            $batchBytes = 0;
        };

        if (count($primaryKey) === 1) {
            $key = $primaryKey[0];
            $last = null;

            while (true) {
                $query = DB::table($table)->orderBy($key)->limit($chunkSize);
                if ($last !== null) {
                    $query->where($key, '>', $last);
                }
                $rows = $query->get();

                if ($rows->isEmpty()) {
                    break;
                }

                foreach ($rows as $row) {
                    $row = (array) $row;
                    $batch[] = $row;
                    $batchBytes += strlen(implode('', array_map('strval', $row)));
                    $last = $row[$key];
                }

                if ($batchBytes >= 512 * 1024) {
                    $writeBatch();
                }
            }
        } else {
            $offset = 0;

            while (true) {
                $rows = DB::table($table)->offset($offset)->limit($chunkSize)->get();
                if ($rows->isEmpty()) {
                    break;
                }

                foreach ($rows as $row) {
                    $batch[] = (array) $row;
                    $batchBytes += strlen(implode('', array_map('strval', (array) $row)));
                }

                $offset += $rows->count();

                if ($batchBytes >= 512 * 1024) {
                    $writeBatch();
                }
            }
        }

        $writeBatch();
    }

    private function encodeValue(\PDO $pdo, mixed $value): string
    {
        if ($value === null) {
            return 'NULL';
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }

        return $pdo->quote((string) $value);
    }

    private function primaryKey(string $table): array
    {
        $keys = DB::select('SHOW KEYS FROM '.$this->quoteIdentifier($table)." WHERE Key_name = 'PRIMARY'");
        $columns = [];

        foreach ($keys as $key) {
            $key = (array) $key;
            $columns[(int) $key['Seq_in_index']] = $key['Column_name'];
        }

        ksort($columns);

        return array_values($columns);
    }

    private function baseTables(): array
    {
        $rows = DB::select("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
        $tables = [];

        foreach ($rows as $row) {
            $values = array_values((array) $row);
            if (isset($values[0])) {
                $tables[] = (string) $values[0];
            }
        }

        return $tables;
    }

    private function quoteIdentifier(string $identifier): string
    {
        return '`'.str_replace('`', '``', $identifier).'`';
    }
}
