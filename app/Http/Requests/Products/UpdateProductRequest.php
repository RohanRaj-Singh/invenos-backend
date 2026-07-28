<?php

namespace App\Http\Requests\Products;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Use a closure-based check that directly queries the database.
        // This avoids issues with route parameter access in FormRequest validation.
        return [
            'name' => 'required|string|max:255',
            'sku' => [
                'required', 'string', 'max:100',
                function ($attribute, $value, $fail) {
                    $id = $this->route('id') ?? $this->input('_product_id');
                    $exists = \App\Models\Product::withTrashed()
                        ->where('sku', $value)
                        ->when($id, fn ($q) => $q->where('id', '!=', $id))
                        ->exists();
                    if ($exists) {
                        $fail('This SKU is already taken.');
                    }
                },
            ],
            'barcode' => [
                'nullable', 'string', 'max:100',
                function ($attribute, $value, $fail) {
                    if (!$value) return;
                    $id = $this->route('id') ?? $this->input('_product_id');
                    $exists = \App\Models\Product::withTrashed()
                        ->where('barcode', $value)
                        ->when($id, fn ($q) => $q->where('id', '!=', $id))
                        ->exists();
                    if ($exists) {
                        $fail('This barcode is already taken.');
                    }
                },
            ],
            'category_id' => 'nullable|integer|exists:product_categories,id',
            'description' => 'nullable|string|max:2000',
            'base_unit_id' => 'required|string|max:50',
            'track_inventory' => 'boolean',
            'low_stock_threshold' => 'nullable|numeric|min:0',
            'supplier_name' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:100',
            'stock_quantity' => 'nullable|numeric|min:0',
            'default_purchase_cost' => 'nullable|numeric|min:0',
            'allow_negative_stock' => 'boolean',
            'selling_units' => 'nullable|array',
            'selling_units.*.name' => 'required_with:selling_units|string|max:100',
            'selling_units.*.sale_price' => 'required_with:selling_units|numeric|min:0',
            'selling_units.*.quantity' => 'nullable|numeric|min:0.01',
            // Packaging levels (optional — only if product uses packaging)
            'packaging' => 'nullable|array',
            'packaging.*.container_unit_id' => 'required_with:packaging|integer|exists:product_units,id',
            'packaging.*.contains_unit_id' => 'required_with:packaging|integer|exists:product_units,id|different:packaging.*.container_unit_id',
            'packaging.*.quantity' => 'required_with:packaging|numeric|min:0.01',
            'packaging.*.level' => 'required_with:packaging|integer|min:1',
        ];
    }
}
