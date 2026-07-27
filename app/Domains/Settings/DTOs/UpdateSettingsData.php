<?php

namespace App\Domains\Settings\DTOs;

class UpdateSettingsData
{
    public function __construct(
        public readonly ?array $business = null,
        public readonly ?array $pos = null,
        public readonly ?array $inventory = null,
        public readonly ?array $sales = null,
        public readonly ?array $purchases = null,
        public readonly ?array $receipt = null,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            business: $data['business'] ?? null,
            pos: $data['pos'] ?? null,
            inventory: $data['inventory'] ?? null,
            sales: $data['sales'] ?? null,
            purchases: $data['purchases'] ?? null,
            receipt: $data['receipt'] ?? null,
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'business' => $this->business,
            'pos' => $this->pos,
            'inventory' => $this->inventory,
            'sales' => $this->sales,
            'purchases' => $this->purchases,
            'receipt' => $this->receipt,
        ], fn ($v) => $v !== null);
    }
}
