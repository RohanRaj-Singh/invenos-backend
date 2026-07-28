<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CleanupSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Starting database cleanup for end-to-end testing...');

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        $tables = [
            'financial_transactions',
            'inventory_transactions',
            'sale_items',
            'sales',
            'purchase_bill_items',
            'purchase_bills',
            'expenses',
            'selling_units',
            'products',
        ];

        $counts = [];
        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                $count = DB::table($table)->count();
                if ($count > 0) {
                    DB::table($table)->delete();
                    $counts[$table] = $count;
                    $this->command->info("  Cleared {$count} rows from {$table}");
                } else {
                    $this->command->line("  {$table}: already empty");
                }
            } else {
                $this->command->warn("  {$table}: table does not exist");
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('');
        $this->command->info('=== Cleanup Complete ===');
        $this->command->info('Preserved: users, roles, permissions, settings, contacts, categories, expense_categories');

        $total = array_sum($counts);
        $this->command->info("Total rows cleared: {$total}");
    }
}
