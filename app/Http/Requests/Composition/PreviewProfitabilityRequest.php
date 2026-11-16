<?php

namespace App\Http\Requests\Composition;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Inputs for the read-only POS profitability preview.
 *
 * Deliberately accepts no cost, profit or margin fields: those are always
 * resolved server-side.
 */
class PreviewProfitabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'composition_id' => ['nullable', 'integer', 'min:1'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'selling_unit_id' => ['nullable', 'integer', 'min:1'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'overrides' => ['nullable', 'array'],
            'overrides.*.composition_item_id' => ['required_with:overrides', 'integer', 'min:1'],
            'overrides.*.quantity' => ['required_with:overrides', 'numeric', 'gt:0'],
            'overrides.*.unit_id' => ['nullable', 'string', 'max:50'],
            'optional_item_ids' => ['nullable', 'array'],
            'optional_item_ids.*' => ['integer', 'min:1'],
        ];
    }
}
