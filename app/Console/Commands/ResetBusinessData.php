<?php

namespace App\Console\Commands;

use App\Models\Consultation;
use App\Models\Contact;
use App\Models\Expense;
use App\Models\FinancialTransaction;
use App\Models\InventoryTransaction;
use App\Models\Prescription;
use App\Models\PrescriptionImage;
use App\Models\PrescriptionItem;
use App\Models\Product;
use App\Models\PurchaseBill;
use App\Models\PurchaseBillItem;
use App\Models\ReturnModel;
use App\Models\ReturnItem;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResetBusinessData extends Command
{
    protected $signature = 'invenos:reset-data
        {--force : Skip confirmation prompt}
        {--keep-contacts : Keep contact records (only clear transactions)}
        {--keep-products : Keep product records (only clear transactions)}';

    protected $description = 'Remove all transactional business data while preserving settings, users, and system configuration';

    public function handle(): int
    {
        if (!$this->option('force') && !$this->confirm('This will DELETE all sales, purchases, returns, expenses, payments, inventory transactions, clinic data, and contacts. Continue?')) {
            $this->info('Cancelled.');
            return Command::SUCCESS;
        }

        $this->info('Resetting business data...');
        $this->newLine();

        // ─── Order matters — delete children before parents ───

        $this->warn('  ▸ Deleting prescription images...');
        PrescriptionImage::query()->forceDelete();

        $this->warn('  ▸ Deleting prescription items...');
        PrescriptionItem::query()->forceDelete();

        $this->warn('  ▸ Deleting prescriptions...');
        Prescription::query()->forceDelete();

        $this->warn('  ▸ Deleting consultations...');
        Consultation::query()->forceDelete();

        $this->warn('  ▸ Deleting return items...');
        ReturnItem::query()->forceDelete();

        $this->warn('  ▸ Deleting returns...');
        ReturnModel::query()->forceDelete();

        $this->warn('  ▸ Deleting sale items...');
        SaleItem::query()->forceDelete();

        $this->warn('  ▸ Deleting sales...');
        Sale::query()->forceDelete();

        $this->warn('  ▸ Deleting purchase bill items...');
        PurchaseBillItem::query()->forceDelete();

        $this->warn('  ▸ Deleting purchase bills...');
        PurchaseBill::query()->forceDelete();

        $this->warn('  ▸ Deleting inventory transactions...');
        InventoryTransaction::query()->forceDelete();

        $this->warn('  ▸ Deleting financial transactions...');
        FinancialTransaction::query()->forceDelete();

        $this->warn('  ▸ Deleting expenses...');
        Expense::query()->forceDelete();

        // ─── Products ────────────────────────────────────────────
        if ($this->option('keep-products')) {
            $this->line('  ▸ Keeping products (--keep-products). Resetting stock to 0...');
            Product::query()->update([
                'stock_quantity' => 0,
                'status' => 'out-of-stock',
            ]);
        } else {
            $this->warn('  ▸ Deleting products...');
            Product::query()->forceDelete();

            $this->warn('  ▸ Resetting product auto-increment...');
            $this->resetAutoIncrement('products');
        }

        // ─── Contacts ────────────────────────────────────────────
        if ($this->option('keep-contacts')) {
            $this->line('  ▸ Keeping contacts (--keep-contacts). Resetting balances...');
            Contact::query()->update([
                'current_balance' => 0,
                'opening_balance' => 0,
            ]);
        } else {
            $this->warn('  ▸ Deleting contacts...');
            Contact::query()->forceDelete();
            $this->resetAutoIncrement('contacts');
        }

        // ─── Reset auto-increment for key tables ────────────────
        $tables = [
            'sales', 'sale_items',
            'purchase_bills', 'purchase_bill_items',
            'returns', 'return_items',
            'inventory_transactions', 'financial_transactions',
            'expenses',
            'consultations', 'prescriptions', 'prescription_items', 'prescription_images',
        ];

        foreach ($tables as $table) {
            $this->resetAutoIncrement($table);
        }

        $this->newLine();
        $this->info('✅ Business data reset complete.');
        $this->line('   Settings, users, roles, permissions, categories, and product units preserved.');

        return Command::SUCCESS;
    }

    private function resetAutoIncrement(string $table): void
    {
        DB::statement("ALTER TABLE `{$table}` AUTO_INCREMENT = 1");
    }
}
