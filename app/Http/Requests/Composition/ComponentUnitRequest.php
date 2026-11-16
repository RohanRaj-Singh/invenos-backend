<?php

namespace App\Http\Requests\Composition;

use Illuminate\Foundation\Http\FormRequest;

class ComponentUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'component_product_id' => ['required', 'integer', 'exists:products,id'],
        ];
    }
}
