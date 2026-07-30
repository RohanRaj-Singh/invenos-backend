<?php

namespace App\Domains\Contacts\Services;

use App\Domains\Contacts\DTOs\CreateContactData;
use App\Models\Contact;
use App\Models\FinancialTransaction;
use Illuminate\Pagination\LengthAwarePaginator;

class ContactService
{
    public function search(string $query = '', ?string $role = null, int $perPage = 25): LengthAwarePaginator
    {
        $q = Contact::query();

        if ($query) {
            $q->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('phone', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%")
                  ->orWhere('company_name', 'like', "%{$query}%");
            });
        }

        if ($role && $role !== 'all') {
            $q->whereJsonContains('roles', $role);
        }

        return $q->orderBy('name')->paginate($perPage);
    }

    public function create(CreateContactData $data): Contact
    {
        $contact = Contact::create($data->toArray());

        // Record opening balance as a financial transaction
        if ($data->openingBalance > 0) {
            FinancialTransaction::create([
                'contact_id' => $contact->id,
                'direction' => $data->balanceType === 'payable' ? 'out' : 'in',
                'type' => 'adjustment',
                'date' => now()->format('Y-m-d'),
                'amount' => $data->openingBalance,
                'method' => 'transfer',
                'reference' => 'OPENING',
                'description' => 'Opening balance (on creation)',
                'created_by' => 'System',
            ]);
        }

        return $contact;
    }

    public function update(int $id, array $data): Contact
    {
        $contact = Contact::findOrFail($id);
        $contact->update($data);
        return $contact;
    }

    public function delete(int $id): ?bool
    {
        $contact = Contact::findOrFail($id);
        app(\App\Services\Lifecycle\RecordLifecycleService::class)->delete(
            $contact,
            request('reason', 'Deleted from contact module'),
            \Illuminate\Support\Facades\Auth::user() ?? \App\Models\User::first(),
        );
        return true;
    }

    public function restore(int $id): Contact
    {
        $contact = Contact::withTrashed()->findOrFail($id);
        $contact->restore();
        return $contact;
    }

    public function get(int $id): Contact
    {
        return Contact::findOrFail($id);
    }

    public function updateRoles(int $id, array $roles): Contact
    {
        $contact = Contact::findOrFail($id);
        $contact->roles = $roles;
        $contact->save();
        return $contact;
    }
}
