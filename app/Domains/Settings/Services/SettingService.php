<?php

namespace App\Domains\Settings\Services;

use App\Domains\Settings\DTOs\UpdateSettingsData;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class SettingService
{
    public function get(): array
    {
        return Cache::remember('app_settings', 3600, function () {
            $setting = Setting::first();
            return $setting ? $setting->values : $this->defaults();
        });
    }

    public function update(UpdateSettingsData $data): array
    {
        $settings = Setting::first() ?? new Setting();
        $current = $settings->values ?? $this->defaults();

        foreach ($data->toArray() as $group => $values) {
            $current[$group] = array_merge($current[$group] ?? [], $values);
        }

        $settings->values = $current;
        $settings->save();

        Cache::forget('app_settings');

        return $current;
    }

    public function reset(): array
    {
        $defaults = $this->defaults();
        $settings = Setting::first() ?? new Setting();
        $settings->values = $defaults;
        $settings->save();
        Cache::forget('app_settings');
        return $defaults;
    }

    public function defaults(): array
    {
        return [
            'business' => [
                'business_name' => 'Invenos',
                'currency' => 'PKR',
                'currency_symbol' => 'Rs.',
                'timezone' => 'Asia/Karachi',
                'date_format' => 'YYYY-MM-DD',
                'time_format' => '12h',
                'address' => '',
                'phone' => '',
                'email' => '',
                'website' => '',
                'description' => '',
                'business_logo' => '',
            ],
            'pos' => [
                'default_customer' => 'Walk-in Customer',
                'default_payment_method' => 'cash',
                'receipt_size' => '80mm',
                'auto_print_receipt' => false,
                'show_product_images' => true,
                'enable_hold_sales' => true,
                'barcode_scanner_enabled' => true,
                'keyboard_shortcuts_enabled' => true,
                'confirm_before_deleting' => true,
                'auto_focus_barcode' => false,
            ],
            'inventory' => [
                'allow_negative_stock' => false,
                'low_stock_threshold' => 10,
                'default_stock_unit' => 'piece',
                'auto_generate_sku' => true,
                'barcode_format' => 'CODE128',
                'default_category' => '',
                'stock_valuation_method' => 'fifo',
            ],
            'sales' => [
                'invoice_prefix' => 'INV-',
                'invoice_number_format' => '{PREFIX}{NUMBER}',
                'default_tax' => 0,
                'default_discount' => 0,
                'allow_price_override' => true,
                'allow_backdated_sales' => false,
                'round_totals' => true,
                'enable_draft_sales' => false,
            ],
            'purchases' => [
                'purchase_prefix' => 'PUR-',
                'purchase_number_format' => '{PREFIX}{NUMBER}',
                'auto_update_cost_price' => true,
                'default_supplier' => '',
                'allow_backdated_purchases' => false,
                'require_supplier' => true,
            ],
            'receipt' => [
                // Header toggles
                'show_business_logo' => true,
                'show_business_name' => true,
                'show_business_address' => true,
                'show_phone' => true,
                'show_email' => false,
                'show_website' => false,
                'show_tax_number' => false,
                // Titles
                'purchase_title' => 'Purchase Bill',
                'sale_title' => 'Sale Invoice',
                // Info visibility
                'show_invoice_number' => true,
                'show_date' => true,
                'show_payment_status' => true,
                'show_payment_method' => false,
                // Party fields
                'show_party_name' => true,
                'show_party_phone' => true,
                'show_party_address' => false,
                // Items table
                'show_item_sku' => false,
                'show_item_barcode' => false,
                'show_item_unit' => true,
                'show_item_discount' => true,
                // Totals
                'show_subtotal' => true,
                'show_discount' => true,
                'show_tax' => false,
                'show_grand_total' => true,
                'show_paid' => true,
                'show_remaining' => true,
                // Footer
                'header_text' => 'Thank you for your business!',
                'footer_text' => 'Goods once sold will not be taken back.',
                'terms_conditions' => '',
                // Signature
                'show_customer_signature' => false,
                'show_authorized_signature' => false,
                'show_received_by' => false,
                // Print
                'paper_size' => 'A4',
                'show_print_date' => false,
                'show_page_numbers' => false,
            ],
        ];
    }
}
