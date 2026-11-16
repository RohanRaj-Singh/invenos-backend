<?php

namespace App\Http\Requests\Composition;

use Illuminate\Foundation\Http\FormRequest;

class ComponentSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'exclude_product_id' => ['nullable', 'integer', 'min:1', 'exists:products,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * "No product to exclude" is expressed as 0 by some callers (e.g. the inline
     * formula form, which has no product id yet). Treat it as absent instead of
     * failing `exists` — otherwise ingredient search breaks before it starts.
     */
    protected function prepareForValidation(): void
    {
        $exclude = $this->input('exclude_product_id');

        if ($exclude !== null && (! is_numeric($exclude) || (int) $exclude <= 0)) {
            $this->merge(['exclude_product_id' => null]);
        }

        $perPage = $this->input('per_page');
        if ($perPage !== null && (! is_numeric($perPage) || (int) $perPage <= 0)) {
            $this->merge(['per_page' => null]);
        }
    }
}
