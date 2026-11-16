<?php

namespace App\Domains\Composition\DTOs;

class SaveCompositionData
{
    /**
     * @param  CompositionItemData[]  $items
     */
    public function __construct(
        public readonly int $productId,
        public readonly string $kind,
        public readonly array $items,
        public readonly ?string $name = null,
        public readonly float $outputQuantity = 1.0,
        public readonly ?string $outputUnitId = null,
        public readonly ?string $notes = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            productId: (int) ($data['product_id'] ?? 0),
            kind: $data['kind'] ?? '',
            items: array_map(
                fn ($item) => $item instanceof CompositionItemData ? $item : CompositionItemData::fromArray($item),
                $data['items'] ?? [],
            ),
            name: $data['name'] ?? null,
            outputQuantity: (float) ($data['output_quantity'] ?? 1),
            outputUnitId: $data['output_unit_id'] ?? null,
            notes: $data['notes'] ?? null,
        );
    }
}
