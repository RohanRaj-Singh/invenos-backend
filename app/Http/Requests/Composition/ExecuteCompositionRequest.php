<?php

namespace App\Http\Requests\Composition;

use App\Models\ProductComposition;
use Illuminate\Foundation\Http\FormRequest;

class ExecuteCompositionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage', ProductComposition::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'quantity' => ['required', 'numeric', 'gt:0'],
            'quantity_unit_id' => ['nullable', 'string', 'max:50'],
            'optional_item_ids' => ['nullable', 'array'],
            'optional_item_ids.*' => ['integer', 'min:1'],
            'overrides' => ['nullable', 'array'],
            'overrides.*.composition_item_id' => ['required', 'integer', 'min:1'],
            'overrides.*.quantity' => ['required', 'numeric', 'gt:0'],
            'overrides.*.unit_id' => ['nullable', 'string', 'max:50'],
            'source_type' => ['nullable', 'string', 'max:50'],
            'source_id' => ['nullable', 'integer', 'min:1'],
            'reference' => ['nullable', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:100'],
            'document_date' => ['nullable', 'date'],
            'idempotency_key' => ['nullable', 'string', 'max:100'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('idempotency_key') && $this->hasHeader('Idempotency-Key')) {
            $this->merge(['idempotency_key' => $this->header('Idempotency-Key')]);
        }
    }
}
