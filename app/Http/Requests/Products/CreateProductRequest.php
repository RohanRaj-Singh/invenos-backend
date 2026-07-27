<?php

namespace App\Http\Requests\Products;

use Illuminate\Foundation\Http\FormRequest;

class CreateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:products,sku',
            'barcode' => 'nullable|string|max:100|unique:products,barcode',
            'category_id' => 'nullable|integer|exists:product_categories,id',
            'description' => 'nullable|string|max:2000',
            'base_unit_id' => 'required|string|max:50',
            'track_inventory' => 'boolean',
            'low_stock_threshold' => 'nullable|numeric|min:0',
            'supplier_name' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:100',
            'selling_units' => 'nullable|array',
            'selling_units.*.name' => 'required_with:selling_units|string|max:100',
            'selling_units.*.sale_price' => 'required_with:selling_units|numeric|min:0',
            'selling_units.*.quantity' => 'nullable|numeric|min:0.01',
        ];
    }
}
