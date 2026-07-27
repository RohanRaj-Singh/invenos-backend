<?php

namespace App\Http\Requests\Contacts;

use Illuminate\Foundation\Http\FormRequest;

class CreateContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => 'required|in:person,organization',
            'roles' => 'required|array|min:1',
            'roles.*' => 'string|in:customer,supplier,patient,doctor,employee',
            'name' => 'required|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'required|string|max:50',
            'email' => 'nullable|email|max:255',
            'cnic' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'opening_balance' => 'nullable|numeric|min:0',
            'balance_type' => 'nullable|in:receivable,payable',
            'notes' => 'nullable|string|max:1000',
        ];
    }
}
