<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BackupController extends Controller
{
    protected string $backupDir = 'backups';

    public function index(): Response
    {
        $backupPath = storage_path('app/backups');
        $files = [];

        if (is_dir($backupPath)) {
            $all = glob($backupPath . '/*.sql');
            rsort($all);
            foreach (array_slice($all, 0, 20) as $file) {
                $files[] = [
                    'name' => basename($file),
                    'size' => $this->formatBytes(filesize($file)),
                    'date' => date('Y-m-d H:i', filemtime($file)),
                ];
            }
        }

        return Inertia::render('settings/BackupRestore', [
            'backups' => $files,
        ]);
    }

    public function create(): RedirectResponse
    {
        try {
            $filename = 'backup-' . now()->format('Y-m-d-Hi') . '.sql';
            $path = storage_path('app/' . $this->backupDir . '/' . $filename);

            if (!is_dir(dirname($path))) {
                mkdir(dirname($path), 0755, true);
            }

            $db = config('database.connections.mysql');
            $cmd = sprintf(
                'mysqldump --host=%s --port=%s --user=%s --password=%s %s --no-tablespaces --routines --skip-lock-tables 2>/dev/null',
                escapeshellarg($db['host']),
                escapeshellarg($db['port']),
                escapeshellarg($db['username']),
                escapeshellarg($db['password']),
                escapeshellarg($db['database'])
            );

            $output = null;
            $resultCode = null;
            exec($cmd, $output, $resultCode);

            if ($resultCode === 0 && !empty($output)) {
                file_put_contents($path, implode("\n", $output));
            } else {
                // Fallback: PHP-based export
                $sql = $this->phpExport();
                file_put_contents($path, $sql);
            }

            return back()->with('success', "Backup created: {$filename}");
        } catch (\Exception $e) {
            return back()->with('error', 'Backup failed: ' . $e->getMessage());
        }
    }

    public function download(string $filename)
    {
        $path = storage_path('app/backups/' . basename($filename));
        if (!file_exists($path)) {
            return back()->with('error', 'Backup file not found.');
        }
        return response()->download($path);
    }

    public function restore(Request $request): RedirectResponse
    {
        $request->validate(['file' => 'required|file|mimes:sql,txt|max:51200']);

        try {
            $sql = file_get_contents($request->file('file')->getRealPath());
            // Disable foreign key checks for safe restore
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            foreach (explode(";\n", $sql) as $statement) {
                $statement = trim($statement);
                if (!empty($statement)) {
                    try {
                        DB::unprepared($statement);
                    } catch (\Exception $e) {
                        // Skip individual statement errors during restore
                        continue;
                    }
                }
            }
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            return back()->with('success', 'Database restored from uploaded file.');
        } catch (\Exception $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            return back()->with('error', 'Restore failed: ' . $e->getMessage());
        }
    }

    public function destroy(string $filename): RedirectResponse
    {
        $path = storage_path('app/backups/' . basename($filename));
        if (file_exists($path)) {
            unlink($path);
        }
        return back()->with('success', 'Backup deleted.');
    }

    private function phpExport(): string
    {
        $tables = DB::select('SHOW TABLES');
        $dbName = config('database.connections.mysql.database');
        $key = 'Tables_in_' . $dbName;
        $sql = "SET FOREIGN_KEY_CHECKS=0;\n\n";

        foreach ($tables as $table) {
            $name = $table->$key;
            $create = DB::select("SHOW CREATE TABLE `{$name}`")[0]->{'Create Table'};
            $sql .= "DROP TABLE IF EXISTS `{$name}`;\n";
            $sql .= "{$create};\n\n";

            $rows = DB::table($name)->get();
            foreach ($rows as $row) {
                $vals = array_map(fn ($v) => is_null($v) ? 'NULL' : "'" . addslashes((string) $v) . "'", (array) $row);
                $sql .= "INSERT INTO `{$name}` VALUES (" . implode(',', $vals) . ");\n";
            }
            $sql .= "\n";
        }

        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";
        return $sql;
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 1) . ' ' . $units[$i];
    }
}
