<?php

namespace Database\Seeders;

use App\Models\{User, Setting, ExpenseCategory};
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ─── 1. Users ─────────────────────────────────────────
        $admin = User::firstOrCreate(
            ['email' => 'mahinder@invenos.com'],
            ['name' => 'Mahinder', 'username' => 'mahinder', 'password' => bcrypt('khalsa@1313'), 'role' => 'admin', 'active' => true]
        );
        User::firstOrCreate(
            ['email' => 'saleem@invenos.com'],
            ['name' => 'Saleem', 'username' => 'saleem', 'password' => bcrypt('1234'), 'role' => 'salesman', 'active' => true]
        );

        // ─── 2. Permissions ───────────────────────────────────
        $permissions = [
            'dashboard.view',
            'products.view', 'products.create', 'products.edit', 'products.delete',
            'inventory.view', 'inventory.adjust_stock',
            'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.delete',
            'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
            'sales.process_return', 'sales.apply_discount', 'sales.override_price', 'sales.print_invoice',
            'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
            'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',
            'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
            'reports.view', 'reports.print', 'reports.export',
            'settings.access',
        ];
        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $adminRole->givePermissionTo(Permission::all());
        $admin->assignRole('admin');

        // ─── 3. Settings ──────────────────────────────────────
        if (!Setting::exists()) {
            Setting::create(['values' => [
                'business' => ['business_name' => 'Invenos', 'currency' => 'PKR', 'currency_symbol' => 'Rs.', 'timezone' => 'Asia/Karachi', 'date_format' => 'YYYY-MM-DD', 'time_format' => '12h', 'address' => '123 Main Street, Lahore', 'phone' => '+92 300 1234567', 'email' => 'info@invenos.com', 'website' => 'https://invenos.com', 'description' => 'Cloud Inventory & POS System'],
                'pos' => ['default_customer' => 'Walk-in Customer', 'default_payment_method' => 'cash', 'receipt_size' => '80mm', 'auto_print_receipt' => false, 'show_product_images' => true, 'enable_hold_sales' => true, 'barcode_scanner_enabled' => true, 'keyboard_shortcuts_enabled' => true, 'confirm_before_deleting' => true, 'auto_focus_barcode' => false],
                'inventory' => ['allow_negative_stock' => false, 'low_stock_threshold' => 10, 'default_stock_unit' => 'piece', 'auto_generate_sku' => true, 'barcode_format' => 'CODE128', 'default_category' => '', 'stock_valuation_method' => 'fifo'],
                'sales' => ['invoice_prefix' => 'INV-', 'invoice_number_format' => '{PREFIX}{NUMBER}', 'default_tax' => 0, 'default_discount' => 0, 'allow_price_override' => true, 'allow_backdated_sales' => false, 'round_totals' => true, 'enable_draft_sales' => false],
                'purchases' => ['purchase_prefix' => 'PUR-', 'purchase_number_format' => '{PREFIX}{NUMBER}', 'auto_update_cost_price' => true, 'default_supplier' => '', 'allow_backdated_purchases' => false, 'require_supplier' => true],
                'receipt' => ['header_text' => 'Thank you for your business!', 'footer_text' => 'Goods once sold will not be taken back.', 'show_business_logo' => true, 'print_address' => true, 'print_phone' => true, 'print_barcode' => false, 'paper_width' => 80],
            ]]);
        }

        // ─── 4. Default expense categories ────────────────────
        foreach (['Rent', 'Electricity', 'Internet', 'Salaries', 'Fuel', 'Office Supplies', 'Marketing'] as $name) {
            ExpenseCategory::firstOrCreate(['name' => $name], ['description' => "$name expenses", 'color' => '#78716c']);
        }
    }
}
