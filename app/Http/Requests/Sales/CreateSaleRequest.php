<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;

class CreateSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invoice_number' => 'nullable|string|max:50|unique:sales,invoice_number',
            'idempotency_key' => 'nullable|string|max:100',
            'customer_id' => 'nullable|integer|exists:contacts,id',
            'date' => 'nullable|date',
            'source' => 'nullable|string|in:pos,clinic,manual',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.packaging_quantity' => 'nullable|numeric|min:0',
            'items.*.packaging_name' => 'nullable|string|max:255',
            // Existence and ownership are resolved in SaleService, which can name
            // the product and tell the user how to recover; a generic field error
            // here would only hide that.
            'items.*.selling_unit_id' => 'nullable|integer|min:1',
            'items.*.base_unit_quantity' => 'nullable|numeric|min:0',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.total' => 'required|numeric|min:0',
            'items.*.formula_composition_id' => 'nullable|integer|min:1',
            'items.*.formula_overrides' => 'nullable|array',
            'items.*.formula_overrides.*.composition_item_id' => 'required|integer|min:1',
            'items.*.formula_overrides.*.quantity' => 'required|numeric|gt:0',
            'items.*.formula_overrides.*.unit_id' => 'nullable|string|max:50',
            'items.*.formula_optional_item_ids' => 'nullable|array',
            'items.*.formula_optional_item_ids.*' => 'integer|min:1',
            'discount' => 'nullable|numeric|min:0',
            'amount_paid' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|string',
            'payment_status' => 'nullable|in:paid,partial,unpaid',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'invoice_number' => $this->invoice_number ?? 'INV-'.now()->format('ymd').'-'.str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT),
            'date' => $this->date ?? now()->format('Y-m-d'),
            'source' => $this->source ?? 'pos',
        ]);
    }
}
