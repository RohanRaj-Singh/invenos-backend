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

        // 4. Contacts (static — no Faker dependency)
        $customerNames = ['Ahmed Khan', 'Fatima Ali', 'Muhammad Usman', 'Ayesha Malik', 'Bilal Hussain', 'Sana Tariq', 'Omar Farooq', 'Zainab Noor', 'Hassan Raza', 'Nadia Shah'];
        $customerPhones = ['0300-1234001', '0300-1234002', '0300-1234003', '0300-1234004', '0300-1234005', '0300-1234006', '0300-1234007', '0300-1234008', '0300-1234009', '0300-1234010'];
        $supplierNames = ['Al-Rashid Pharma', 'National Distributors', 'MediPlus Traders', 'Al-Karim Stores', 'Shalimar Suppliers'];
        $supplierPhones = ['042-35760001', '042-35760002', '042-35760003', '042-35760004', '042-35760005'];

        $customers = collect();
        foreach (range(0, 9) as $i) {
            $customers->push(Contact::create([
                'type' => 'person', 'roles' => ['customer'], 'name' => $customerNames[$i],
                'phone' => $customerPhones[$i], 'email' => strtolower(str_replace(' ', '.', $customerNames[$i])) . '@example.com',
                'address' => $customerNames[$i] . ' House, Lahore', 'opening_balance' => 0, 'balance_type' => 'receivable', 'current_balance' => 0,
            ]));
        }
        $suppliers = collect();
        foreach (range(0, 4) as $i) {
            $suppliers->push(Contact::create([
                'type' => 'organization', 'roles' => ['supplier'], 'name' => $supplierNames[$i],
                'company_name' => $supplierNames[$i], 'contact_person' => $customerNames[$i] ?? 'Contact Person',
                'phone' => $supplierPhones[$i], 'email' => strtolower(str_replace(' ', '_', $supplierNames[$i])) . '@example.com',
                'address' => $supplierNames[$i] . ', Lahore', 'opening_balance' => 0, 'balance_type' => 'payable', 'current_balance' => 0,
            ]));
        }

        // 5. Categories + Products
        $categories = collect();
        foreach (['Medicine', 'Cosmetics', 'Groceries', 'Clinic Supplies', 'Mobile Accessories'] as $name) {
            $categories->push(Category::create(['name' => $name, 'description' => "$name category"]));
        }
        $productNames = ['Paracetamol 500mg', 'Amoxil 250mg', 'Vitamin C 1000mg', 'Hand Sanitizer', 'Face Mask Box',
            'Basmati Rice 1kg', 'Cooking Oil 5L', 'Sugar 1kg', 'Tea 200g', 'Soap Bar',
            'Shampoo 200ml', 'Moisturizer 50ml', 'First Aid Kit', 'Bandage Roll', 'Cotton Balls',
            'Phone Screen Guard', 'USB Cable', 'Charger Adapter', 'Earphones', 'Phone Case'];
        $skuPrefixes = ['MED', 'MED', 'MED', 'COS', 'COS', 'GRO', 'GRO', 'GRO', 'GRO', 'COS',
            'COS', 'COS', 'SUP', 'SUP', 'SUP', 'MOB', 'MOB', 'MOB', 'MOB', 'MOB'];
        $baseUnits = ['piece', 'piece', 'piece', 'ml', 'piece', 'g', 'ml', 'g', 'g', 'piece',
            'ml', 'ml', 'piece', 'piece', 'piece', 'piece', 'piece', 'piece', 'piece', 'piece'];

        $products = collect();
        foreach (range(0, 19) as $i) {
            $cat = $categories[$i < 3 ? 0 : ($i < 7 ? 1 : ($i < 9 ? 2 : ($i < 15 ? 3 : 4)))];
            $product = Product::create([
                'name' => $productNames[$i],
                'sku' => $skuPrefixes[$i] . '-' . str_pad((string)($i + 1), 4, '0', STR_PAD_LEFT),
                'barcode' => '890' . str_pad((string)(10000000000 + $i), 10, '0', STR_PAD_LEFT),
                'category_id' => $cat->id,
                'description' => "$productNames[$i] — stock product",
                'base_unit_id' => $baseUnits[$i],
                'stock_quantity' => 100 + ($i * 25),
                'low_stock_threshold' => 10,
                'status' => 'in-stock',
                'supplier_name' => $supplierNames[$i % 5],
                'created_by' => 'Seeder',
            ]);
            SellingUnit::create([
                'product_id' => $product->id,
                'name' => 'Single',
                'unit_id' => $baseUnits[$i],
                'quantity' => 1,
                'sale_price' => 50 + ($i * 30),
                'is_default' => true,
            ]);
            $products->push($product);
        }

        // 6. Sales
        foreach (range(1, 15) as $i) {
            $total = $i * 1000 + 500;
            $sale = Sale::create([
                'invoice_number' => 'INV-' . str_pad((string)(1000 + $i), 5, '0', STR_PAD_LEFT),
                'source' => $i % 3 === 0 ? 'clinic' : 'pos',
                'date' => now()->subDays(30 - $i)->format('Y-m-d'),
                'customer_id' => $customers->random()->id,
                'customer_name' => $customerNames[array_rand($customerNames)],
                'subtotal' => $total,
                'grand_total' => $total,
                'amount_paid' => $total,
                'outstanding_balance' => 0,
                'payment_status' => 'paid',
                'created_by' => 'Seeder',
            ]);
            foreach ($products->random(min(4, $products->count())) as $product) {
                $qty = 1;
                $price = ($product->id * 10) + 50;
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
            $total = $i * 5000 + 1000;
            PurchaseBill::create([
                'invoice_ref' => 'PUR-' . str_pad((string)(1000 + $i), 5, '0', STR_PAD_LEFT),
                'supplier_id' => $suppliers->random()->id,
                'supplier_name' => $supplierNames[array_rand($supplierNames)],
                'date' => now()->subDays(30 - $i)->format('Y-m-d'),
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
        $expenseCategories = ['Rent', 'Electricity', 'Internet', 'Salaries', 'Fuel', 'Office Supplies', 'Marketing'];
        foreach ($expenseCategories as $name) {
            ExpenseCategory::create(['name' => $name, 'description' => "$name expenses", 'color' => '#78716c']);
        }
        foreach (range(1, 20) as $i) {
            Expense::create([
                'expense_number' => 'EXP-' . str_pad((string)(1000 + $i), 6, '0', STR_PAD_LEFT),
                'date' => now()->subDays(30 - ($i % 30))->format('Y-m-d'),
                'category_id' => ExpenseCategory::inRandomOrder()->first()->id,
                'amount' => $i * 500 + 100,
                'paid_to' => 'Vendor ' . $i,
                'payment_method' => ['cash', 'card', 'transfer'][$i % 3],
                'notes' => 'Expense entry #' . $i,
                'created_by' => 'Seeder',
            ]);
        }
    }
}
