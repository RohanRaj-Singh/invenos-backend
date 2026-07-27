<?php

namespace App\Domains\Contacts\Services;

use App\Domains\Contacts\DTOs\CreateContactData;
use App\Models\Contact;
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
        return $contact->delete();
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
