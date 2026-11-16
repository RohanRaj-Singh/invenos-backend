<?php

namespace App\Http\Requests\Products;

use App\Models\ProductComposition;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'sku' => 'required|string|max:100',
            'barcode' => [
                'nullable', 'string', 'max:100',
                Rule::unique('products', 'barcode')->whereNull('deleted_at'),
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
            // Packaging levels (optional — products without packaging use legacy model)
            'packaging' => 'nullable|array',
            'packaging.*.container_unit_id' => 'required_with:packaging|integer|exists:product_units,id',
            'packaging.*.contains_unit_id' => 'required_with:packaging|integer|exists:product_units,id|different:packaging.*.container_unit_id',
            'packaging.*.quantity' => 'required_with:packaging|numeric|min:0.01',
            'packaging.*.level' => 'required_with:packaging|integer|min:1',
            // Optional inline formula. When present, the product and its first
            // composition version are created in one transaction.
            'composition' => 'nullable|array',
            'composition.kind' => ['nullable', Rule::in(ProductComposition::KINDS)],
            'composition.name' => 'nullable|string|max:255',
            'composition.output_quantity' => 'nullable|numeric|gt:0',
            'composition.output_unit_id' => 'nullable|string|max:50',
            'composition.notes' => 'nullable|string|max:2000',
            'composition.items' => 'required_with:composition|array|min:1',
            'composition.items.*.component_product_id' => 'required_with:composition.items|integer|exists:products,id',
            'composition.items.*.quantity' => 'required_with:composition.items|numeric|gt:0',
            'composition.items.*.unit_id' => 'nullable|string|max:50',
            'composition.items.*.wastage_pct' => 'nullable|numeric|min:0|max:100',
            'composition.items.*.is_optional' => 'nullable|boolean',
            'composition.items.*.sort_order' => 'nullable|integer|min:0',
        ];
    }
}
