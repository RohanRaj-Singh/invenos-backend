<?php

namespace Tests\Feature\Architecture;

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
        ];
        foreach ($paths as $path) {
            $this->assertFileExists(base_path($path), "Missing: $path");
        }
    }

    public function test_domain_directories_have_subdirectories(): void
    {
        $domains = ['Inventory', 'Sales', 'Purchasing', 'Contacts', 'Payments',
                     'Expenses', 'Reports', 'Settings', 'Users', 'Clinic'];
        $required = ['Services', 'DTOs', 'Actions', 'Policies', 'Enums', 'ValueObjects'];
        foreach ($domains as $domain) {
            foreach ($required as $sub) {
                $this->assertDirectoryExists(app_path("Domains/$domain/$sub"));
            }
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
        $this->assertTrue(class_exists(\App\Services\BusinessContext::class));
    }

    public function test_service_contracts_file_exists(): void
    {
        $this->assertFileExists(app_path('Domains/Contracts/ServiceContracts.php'));
    }
}
