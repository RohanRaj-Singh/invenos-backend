<?php

namespace App\Domains\Composition\DTOs;

class CompositionItemData
{
    public function __construct(
        public readonly int $componentProductId,
        public readonly float $quantityBase,
        public readonly ?string $displayUnitId = null,
        public readonly float $wastagePct = 0.0,
        public readonly bool $isOptional = false,
        public readonly ?int $sortOrder = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            componentProductId: (int) ($data['component_product_id'] ?? 0),
            quantityBase: (float) ($data['quantity_base'] ?? 0),
            displayUnitId: $data['display_unit_id'] ?? null,
            wastagePct: (float) ($data['wastage_pct'] ?? 0),
            isOptional: (bool) ($data['is_optional'] ?? false),
            sortOrder: isset($data['sort_order']) ? (int) $data['sort_order'] : null,
        );
    }
}
