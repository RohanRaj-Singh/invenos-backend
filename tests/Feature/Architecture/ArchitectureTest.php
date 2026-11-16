<?php

namespace Tests\Feature\Architecture;

use App\Services\BusinessContext;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ArchitectureTest extends TestCase
{
    public function test_all_domain_services_exist(): void
    {
        $paths = [
            'app/Domains/Inventory/Services/InventoryService.php',
            'app/Domains/Sales/Services/SaleService.php',
            'app/Domains/Purchasing/Services/PurchaseService.php',
            'app/Domains/Contacts/Services/ContactService.php',
            'app/Domains/Expenses/Services/ExpenseService.php',
            'app/Domains/Reports/Services/ReportService.php',
            'app/Domains/Settings/Services/SettingService.php',
            'app/Domains/Users/Services/UserService.php',
            'app/Domains/Payments/Services/PaymentService.php',
            'app/Domains/Clinic/Services/ClinicService.php',
            'app/Domains/Composition/Services/CompositionService.php',
            'app/Domains/Composition/Services/CompositionValidator.php',
        ];
        foreach ($paths as $path) {
            $this->assertFileExists(base_path($path), "Missing: $path");
        }
    }

    public function test_domain_service_directories_exist(): void
    {
        $domains = [
            'Backup', 'Branding', 'Clinic', 'Composition', 'Contacts', 'Expenses', 'Inventory',
            'Payments', 'Products', 'Purchasing', 'Reports', 'Returns', 'Sales',
            'Settings', 'Users',
        ];

        foreach ($domains as $domain) {
            $this->assertDirectoryExists(
                app_path("Domains/{$domain}/Services"),
                "Missing service directory for {$domain}"
            );
        }
    }

    public function test_database_has_required_tables(): void
    {
        foreach (['contacts', 'products', 'sales', 'purchase_bills', 'expenses'] as $table) {
            $this->assertTrue(Schema::hasTable($table), "Missing: $table");
        }
    }

    public function test_contacts_has_json_roles(): void
    {
        $this->assertContains('roles', Schema::getColumnListing('contacts'));
    }

    public function test_business_context_exists(): void
    {
        $this->assertTrue(class_exists(BusinessContext::class));
    }

    public function test_service_contracts_file_exists(): void
    {
        $this->assertFileExists(app_path('Domains/Contracts/ServiceContracts.php'));
    }

    public function test_unreachable_transaction_engine_is_removed(): void
    {
        $this->assertFileDoesNotExist(app_path('Domains/Transactions/Services/TransactionEngine.php'));
        $this->assertFileDoesNotExist(app_path('Providers/TransactionServiceProvider.php'));
    }
}
