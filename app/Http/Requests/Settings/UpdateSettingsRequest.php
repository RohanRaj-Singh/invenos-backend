<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'business' => 'nullable|array',
            'business.business_name' => 'nullable|string|max:255',
            'business.currency' => 'nullable|string|max:10',
            'business.currency_symbol' => 'nullable|string|max:10',
            'business.timezone' => 'nullable|string|max:50',
            'business.address' => 'nullable|string|max:500',
            'business.phone' => 'nullable|string|max:50',
            'business.email' => 'nullable|email|max:255',
            'pos' => 'nullable|array',
            'pos.default_payment_method' => 'nullable|string|in:cash,card,transfer,easypaisa,jazzcash',
            'pos.receipt_size' => 'nullable|string|in:58mm,80mm,a4',
            'inventory' => 'nullable|array',
            'inventory.low_stock_threshold' => 'nullable|numeric|min:0',
            'sales' => 'nullable|array',
            'sales.invoice_prefix' => 'nullable|string|max:20',
            'purchases' => 'nullable|array',
            'purchases.purchase_prefix' => 'nullable|string|max:20',
            'receipt' => 'nullable|array',
            'receipt.header_text' => 'nullable|string|max:500',
            'receipt.footer_text' => 'nullable|string|max:500',
            'receipt.paper_width' => 'nullable|integer|min:40|max:100',
        ];
    }
}
