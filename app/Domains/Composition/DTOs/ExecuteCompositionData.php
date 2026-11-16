<?php

namespace App\Domains\Composition\DTOs;

class ExecuteCompositionData
{
    /**
     * @param  int[]  $optionalItemIds  Composition item ids selected for this execution.
     * @param  CompositionItemOverrideData[]  $overrides  Absolute actual quantities for this execution.
     */
    public function __construct(
        public readonly int $compositionId,
        public readonly float $quantity,
        public readonly ?string $quantityUnitId = null,
        public readonly ?string $sourceType = null,
        public readonly ?int $sourceId = null,
        public readonly ?int $saleItemId = null,
        public readonly ?string $reference = null,
        public readonly ?string $idempotencyKey = null,
        public readonly ?string $createdBy = null,
        public readonly ?int $userId = null,
        public readonly ?string $location = null,
        public readonly ?string $documentDate = null,
        public readonly array $optionalItemIds = [],
        public readonly array $overrides = [],
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            compositionId: (int) ($data['composition_id'] ?? 0),
            quantity: (float) ($data['quantity'] ?? 0),
            quantityUnitId: $data['quantity_unit_id'] ?? null,
            sourceType: $data['source_type'] ?? null,
            sourceId: isset($data['source_id']) ? (int) $data['source_id'] : null,
            saleItemId: isset($data['sale_item_id']) ? (int) $data['sale_item_id'] : null,
            reference: $data['reference'] ?? null,
            idempotencyKey: $data['idempotency_key'] ?? null,
            createdBy: $data['created_by'] ?? null,
            userId: isset($data['user_id']) ? (int) $data['user_id'] : null,
            location: $data['location'] ?? null,
            documentDate: $data['document_date'] ?? null,
            optionalItemIds: array_map('intval', $data['optional_item_ids'] ?? []),
            overrides: array_map(
                fn ($override) => $override instanceof CompositionItemOverrideData
                    ? $override
                    : CompositionItemOverrideData::fromArray($override),
                $data['overrides'] ?? [],
            ),
        );
    }
}
