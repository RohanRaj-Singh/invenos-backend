<?php

namespace Database\Seeders;

use App\Models\{
    User, Contact, Category, Product, SellingUnit,
    Sale, SaleItem, PurchaseBill, PurchaseBillItem,
    ExpenseCategory, Expense, Setting
};
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Users
        $admin = User::create([
            'name' => 'Mahinder',
            'username' => 'mahinder',
            'email' => 'mahinder@invenos.com',
            'password' => bcrypt('khalsa@1313'),
            'role' => 'admin',
            'active' => true,
        ]);
        User::create([
            'name' => 'Saleem',
            'username' => 'saleem',
            'email' => 'saleem@invenos.com',
            'password' => bcrypt('1234'),
            'role' => 'salesman',
            'active' => true,
        ]);

        // 2. Permissions
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
            Permission::create(['name' => $perm, 'guard_name' => 'web']);
        }

        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $adminRole->givePermissionTo(Permission::all());
        $admin->assignRole('admin');

        // 3. Settings
        Setting::create(['values' => [
            'business' => ['business_name' => 'Invenos', 'currency' => 'PKR', 'currency_symbol' => 'Rs.', 'timezone' => 'Asia/Karachi', 'date_format' => 'YYYY-MM-DD', 'time_format' => '12h', 'address' => '123 Main Street, Lahore', 'phone' => '+92 300 1234567', 'email' => 'info@invenos.com', 'website' => 'https://invenos.com', 'description' => 'Cloud Inventory & POS System'],
            'pos' => ['default_customer' => 'Walk-in Customer', 'default_payment_method' => 'cash', 'receipt_size' => '80mm', 'auto_print_receipt' => false, 'show_product_images' => true, 'enable_hold_sales' => true, 'barcode_scanner_enabled' => true, 'keyboard_shortcuts_enabled' => true, 'confirm_before_deleting' => true, 'auto_focus_barcode' => false],
            'inventory' => ['allow_negative_stock' => false, 'low_stock_threshold' => 10, 'default_stock_unit' => 'piece', 'auto_generate_sku' => true, 'barcode_format' => 'CODE128', 'default_category' => '', 'stock_valuation_method' => 'fifo'],
            'sales' => ['invoice_prefix' => 'INV-', 'invoice_number_format' => '{PREFIX}{NUMBER}', 'default_tax' => 0, 'default_discount' => 0, 'allow_price_override' => true, 'allow_backdated_sales' => false, 'round_totals' => true, 'enable_draft_sales' => false],
            'purchases' => ['purchase_prefix' => 'PUR-', 'purchase_number_format' => '{PREFIX}{NUMBER}', 'auto_update_cost_price' => true, 'default_supplier' => '', 'allow_backdated_purchases' => false, 'require_supplier' => true],
            'receipt' => ['header_text' => 'Thank you for your business!', 'footer_text' => 'Goods once sold will not be taken back.', 'show_business_logo' => true, 'print_address' => true, 'print_phone' => true, 'print_barcode' => false, 'paper_width' => 80],
        ]]);

        // 4. Contacts
        $customers = collect();
        foreach (range(1, 10) as $i) {
            $customers->push(Contact::create([
                'type' => 'person', 'roles' => ['customer'], 'name' => fake()->name(),
                'phone' => fake()->phoneNumber(), 'email' => fake()->email(),
                'address' => fake()->address(), 'opening_balance' => 0, 'balance_type' => 'receivable', 'current_balance' => 0,
            ]));
        }
        $suppliers = collect();
        foreach (range(1, 5) as $i) {
            $suppliers->push(Contact::create([
                'type' => 'organization', 'roles' => ['supplier'], 'name' => fake()->company(),
                'company_name' => fake()->company(), 'contact_person' => fake()->name(),
                'phone' => fake()->phoneNumber(), 'email' => fake()->email(),
                'address' => fake()->address(), 'opening_balance' => 0, 'balance_type' => 'payable', 'current_balance' => 0,
            ]));
        }

        // 5. Categories + Products
        $categories = collect();
        foreach (['Medicine', 'Cosmetics', 'Groceries', 'Clinic Supplies', 'Mobile Accessories'] as $name) {
            $categories->push(Category::create(['name' => $name, 'description' => "$name category"]));
        }
        $products = collect();
        foreach (range(1, 20) as $i) {
            $product = Product::create([
                'name' => fake()->unique()->words(3, true),
                'sku' => strtoupper(fake()->unique()->bothify('SKU-####')),
                'barcode' => fake()->unique()->ean13(),
                'category_id' => $categories->random()->id,
                'description' => fake()->sentence(),
                'base_unit_id' => fake()->randomElement(['piece', 'g', 'kg', 'ml']),
                'stock_quantity' => fake()->numberBetween(0, 500),
                'low_stock_threshold' => 10,
                'status' => 'in-stock',
                'supplier_name' => fake()->company(),
                'created_by' => 'Seeder',
            ]);
            SellingUnit::create([
                'product_id' => $product->id,
                'name' => fake()->randomElement(['Single', 'Strip', 'Box']),
                'unit_id' => 'piece',
                'quantity' => fake()->randomElement([1, 10, 50]),
                'sale_price' => fake()->randomFloat(0, 50, 5000),
                'is_default' => true,
            ]);
            $products->push($product);
        }

        // 6. Sales
        foreach (range(1, 15) as $i) {
            $total = fake()->randomFloat(0, 100, 50000);
            $sale = Sale::create([
                'invoice_number' => 'INV-' . str_pad((string)(1000 + $i), 5, '0', STR_PAD_LEFT),
                'source' => fake()->randomElement(['pos', 'clinic']),
                'date' => fake()->dateTimeBetween('-30 days')->format('Y-m-d'),
                'customer_id' => $customers->random()->id,
                'customer_name' => fake()->name(),
                'subtotal' => $total,
                'grand_total' => $total,
                'amount_paid' => $total,
                'outstanding_balance' => 0,
                'payment_status' => 'paid',
                'created_by' => 'Seeder',
            ]);
            foreach ($products->random(rand(1, 4)) as $product) {
                $qty = rand(1, 5);
                $price = rand(50, 500);
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'packaging_quantity' => $qty,
                    'base_unit_quantity' => 1,
                    'base_quantity' => $qty,
                    'unit_price' => $price,
                    'total' => $qty * $price,
                    'category' => $product->category_id ? 'general' : '',
                ]);
            }
        }

        // 7. Purchases
        foreach (range(1, 10) as $i) {
            $total = fake()->randomFloat(0, 1000, 100000);
            $bill = PurchaseBill::create([
                'invoice_ref' => 'PUR-' . str_pad((string)(1000 + $i), 5, '0', STR_PAD_LEFT),
                'supplier_id' => $suppliers->random()->id,
                'supplier_name' => fake()->company(),
                'date' => fake()->dateTimeBetween('-30 days')->format('Y-m-d'),
                'subtotal' => $total,
                'total_amount' => $total,
                'amount_paid' => $total,
                'outstanding_balance' => 0,
                'payment_status' => 'paid',
                'status' => 'received',
                'created_by' => 'Seeder',
            ]);
        }

        // 8. Expenses
        foreach (['Rent', 'Electricity', 'Internet', 'Salaries', 'Fuel', 'Office Supplies', 'Marketing'] as $name) {
            ExpenseCategory::create(['name' => $name, 'description' => "$name expenses", 'color' => fake()->hexColor()]);
        }
        foreach (range(1, 20) as $i) {
            Expense::create([
                'expense_number' => 'EXP-' . str_pad((string)(1000 + $i), 6, '0', STR_PAD_LEFT),
                'date' => fake()->dateTimeBetween('-30 days')->format('Y-m-d'),
                'category_id' => ExpenseCategory::inRandomOrder()->first()->id,
                'amount' => fake()->randomFloat(0, 100, 50000),
                'paid_to' => fake()->company(),
                'payment_method' => fake()->randomElement(['cash', 'card', 'transfer']),
                'notes' => fake()->sentence(),
                'created_by' => 'Seeder',
            ]);
        }
    }
}
