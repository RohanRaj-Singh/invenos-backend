<?php

namespace App\Domains\Contacts\DTOs;

class CreateContactData
{
    public function __construct(
        public readonly string $type,
        public readonly array $roles,
        public readonly string $name,
        public readonly ?string $companyName,
        public readonly ?string $contactPerson,
        public readonly string $phone,
        public readonly ?string $email,
        public readonly ?string $cnic,
        public readonly ?string $address,
        public readonly float $openingBalance,
        public readonly string $balanceType,
        public readonly ?string $notes,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            type: $data['type'],
            roles: $data['roles'] ?? ['customer'],
            name: $data['name'],
            companyName: $data['company_name'] ?? null,
            contactPerson: $data['contact_person'] ?? null,
            phone: $data['phone'],
            email: $data['email'] ?? null,
            cnic: $data['cnic'] ?? null,
            address: $data['address'] ?? null,
            openingBalance: (float) ($data['opening_balance'] ?? 0),
            balanceType: $data['balance_type'] ?? 'receivable',
            notes: $data['notes'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'type' => $this->type,
            'roles' => $this->roles,
            'name' => $this->name,
            'company_name' => $this->companyName,
            'contact_person' => $this->contactPerson,
            'phone' => $this->phone,
            'email' => $this->email,
            'cnic' => $this->cnic,
            'address' => $this->address,
            'opening_balance' => $this->openingBalance,
            'balance_type' => $this->balanceType,
            'notes' => $this->notes,
        ];
    }
}
