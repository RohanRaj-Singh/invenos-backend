<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Contact;
use App\Models\Product;
use App\Models\PurchaseBill;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SystemHealthController extends Controller
{
    public function index(): Response
    {
        // Database connection
        $dbConnected = false;
        $dbName = '';
        $dbSize = null;
        try {
            DB::connection()->getPdo();
            $dbConnected = true;
            $dbName = DB::connection()->getDatabaseName();

            // Approximate DB size (MySQL only)
            if (DB::getDriverName() === 'mysql') {
                $dbSize = DB::select('SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
                    FROM information_schema.tables WHERE table_schema = ?', [$dbName])[0]->size_mb ?? null;
            }
        } catch (\Throwable $e) {
            $dbConnected = false;
        }

        // Migration status
        $migrationsRun = 0;
        $lastMigration = null;
        try {
            $migrationCounts = DB::table('migrations')->selectRaw('COUNT(*) as count, MAX(batch) as last_batch')->first();
            $migrationsRun = $migrationCounts?->count ?? 0;
            $lastMigration = DB::table('migrations')->orderBy('id', 'desc')->value('migration');
        } catch (\Throwable $e) {
            // Migrations table may not exist
        }

        // Storage
        $storagePath = storage_path();
        $diskTotal = disk_total_space($storagePath);
        $diskFree = disk_free_space($storagePath);
        $diskUsed = $diskTotal - $diskFree;
        $diskUsedPct = $diskTotal > 0 ? round(($diskUsed / $diskTotal) * 100, 1) : 0;

        // Recycle bin summary
        $deletedProducts = Product::onlyTrashed()->count();
        $deletedContacts = Contact::onlyTrashed()->count();
        $deletedSales = Sale::onlyTrashed()->count();
        $deletedPurchases = PurchaseBill::onlyTrashed()->count();
        $totalDeleted = $deletedProducts + $deletedContacts + $deletedSales + $deletedPurchases;

        // Last audit activity
        $lastAudit = AuditLog::orderBy('created_at', 'desc')->value('created_at');

        return Inertia::render('utilities/SystemHealth', [
            'database' => [
                'connected' => $dbConnected,
                'name' => $dbName,
                'size_mb' => $dbSize,
                'driver' => DB::getDriverName(),
            ],
            'migrations' => [
                'count' => $migrationsRun,
                'last' => $lastMigration,
            ],
            'storage' => [
                'total_gb' => round($diskTotal / 1024 / 1024 / 1024, 1),
                'free_gb' => round($diskFree / 1024 / 1024 / 1024, 1),
                'used_pct' => $diskUsedPct,
            ],
            'recycle_bin' => [
                'total' => $totalDeleted,
                'products' => $deletedProducts,
                'contacts' => $deletedContacts,
                'sales' => $deletedSales,
                'purchases' => $deletedPurchases,
            ],
            'application' => [
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'environment' => app()->environment(),
                'debug' => config('app.debug'),
                'timezone' => config('app.timezone'),
            ],
            'last_audit' => $lastAudit,
        ]);
    }
}
