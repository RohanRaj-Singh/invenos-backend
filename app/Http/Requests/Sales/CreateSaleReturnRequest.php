<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;

class CreateSaleReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'return_number' => 'required|string|max:50|unique:sales,invoice_number',
            'date' => 'required|date',
            'original_sale_id' => 'required|integer|exists:sales,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.refund_amount' => 'required|numeric|min:0',
            'refund_total' => 'required|numeric|min:0',
            'refund_method' => 'nullable|string',
        ];
    }
}
