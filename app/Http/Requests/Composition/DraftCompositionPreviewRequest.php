<?php

namespace App\Http\Requests\Composition;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates an unsaved formula (product not created yet) for live costing.
 */
class DraftCompositionPreviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'base_unit_id' => ['nullable', 'string', 'max:50'],
            'output_quantity' => ['required', 'numeric', 'gt:0'],
            'output_unit_id' => ['nullable', 'string', 'max:50'],
            'items' => ['present', 'array', 'max:100'],
            'items.*.component_product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_id' => ['nullable', 'string', 'max:50'],
            'items.*.wastage_pct' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
