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
                'header_text' => 'Thank you for your business!',
                'footer_text' => 'Goods once sold will not be taken back.',
                'show_business_logo' => true,
                'print_address' => true,
                'print_phone' => true,
                'print_tax_number' => false,
                'print_barcode' => false,
                'print_qr_code' => false,
                'paper_width' => 80,
            ],
        ];
    }
}
