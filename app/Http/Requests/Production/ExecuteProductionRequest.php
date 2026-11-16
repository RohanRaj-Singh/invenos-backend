<?php

namespace App\Http\Requests\Production;

use Illuminate\Foundation\Http\FormRequest;

class ExecuteProductionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('production.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'actual_output_quantity' => ['required', 'numeric', 'gt:0'],
            'output_unit_id' => ['nullable', 'string', 'max:50'],
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
