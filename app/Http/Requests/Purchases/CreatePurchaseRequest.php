<?php

namespace App\Http\Requests\Purchases;

use Illuminate\Foundation\Http\FormRequest;

class CreatePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invoice_ref' => 'required|string|max:50|unique:purchase_bills,invoice_ref',
            'supplier_id' => 'required|integer|exists:contacts,id',
            'date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.purchase_pack_qty' => 'required|numeric|min:0',
            'items.*.purchase_quantity' => 'required|numeric|min:0.01',
            'items.*.purchase_pack_name' => 'nullable|string|max:255',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'amount_paid' => 'nullable|numeric|min:0',
            'payment_status' => 'nullable|in:paid,partial,unpaid',
            'status' => 'nullable|in:received,pending',
        ];
    }
}
