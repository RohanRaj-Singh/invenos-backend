<?php

namespace App\Domains\Sales\DTOs;

use App\Domains\Composition\DTOs\CompositionItemOverrideData;

class SaleItemData
{
    /**
     * @param  CompositionItemOverrideData[]  $formulaOverrides  Runtime quantities per formula unit.
     * @param  int[]  $formulaOptionalItemIds  Optional template items explicitly included.
     */
    public function __construct(
        public readonly int $productId,
        public readonly string $productName,
        public readonly float $packagingQuantity,
        public readonly float $baseUnitQuantity,
        public readonly float $baseQuantity,
        public readonly float $unitPrice,
        public readonly float $total,
        public readonly ?string $packagingName,
        public readonly float $discountPct,
        public readonly string $category,
        public readonly ?int $sellingUnitId = null,
        public readonly ?int $formulaCompositionId = null,
        public readonly array $formulaOverrides = [],
        public readonly array $formulaOptionalItemIds = [],
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            productId: (int) $data['product_id'],
            productName: $data['product_name'] ?? '',
            packagingQuantity: (float) ($data['quantity'] ?? $data['packaging_quantity'] ?? 1),
            baseUnitQuantity: (float) ($data['base_unit_quantity'] ?? 1),
            baseQuantity: (float) ($data['base_quantity'] ?? ($data['quantity'] ?? $data['packaging_quantity'] ?? 1)),
            unitPrice: (float) ($data['unit_price'] ?? 0),
            total: (float) ($data['total'] ?? 0),
            packagingName: $data['packaging_name'] ?? null,
            discountPct: (float) ($data['discount_pct'] ?? 0),
            category: $data['category'] ?? '',
            sellingUnitId: isset($data['selling_unit_id']) ? (int) $data['selling_unit_id'] : null,
            formulaCompositionId: isset($data['formula_composition_id'])
                ? (int) $data['formula_composition_id']
                : null,
            formulaOverrides: array_map(
                fn ($override) => $override instanceof CompositionItemOverrideData
                    ? $override
                    : CompositionItemOverrideData::fromArray((array) $override),
                $data['formula_overrides'] ?? [],
            ),
            formulaOptionalItemIds: array_map(
                'intval',
                $data['formula_optional_item_ids'] ?? [],
            ),
        );
    }
}
