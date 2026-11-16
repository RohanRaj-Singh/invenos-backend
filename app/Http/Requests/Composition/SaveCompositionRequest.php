<?php

namespace App\Http\Requests\Composition;

use App\Models\ProductComposition;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveCompositionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'kind' => ['required', Rule::in(ProductComposition::KINDS)],
            'name' => ['nullable', 'string', 'max:255'],
            'output_quantity' => ['required', 'numeric', 'gt:0'],
            'output_unit_id' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.component_product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_id' => ['nullable', 'string', 'max:50'],
            'items.*.wastage_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.is_optional' => ['nullable', 'boolean'],
            'items.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
