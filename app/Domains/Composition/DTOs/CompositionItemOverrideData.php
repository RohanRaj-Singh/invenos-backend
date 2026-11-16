<?php

namespace App\Domains\Composition\DTOs;

class CompositionItemOverrideData
{
    public function __construct(
        public readonly int $compositionItemId,
        public readonly float $quantity,
        public readonly ?string $unitId = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            compositionItemId: (int) ($data['composition_item_id'] ?? 0),
            quantity: (float) ($data['quantity'] ?? 0),
            unitId: $data['unit_id'] ?? null,
        );
    }
}
