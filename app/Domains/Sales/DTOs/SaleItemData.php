<?php

namespace App\Domains\Sales\DTOs;

class SaleItemData
{
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
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            productId: (int) $data['product_id'],
            productName: $data['product_name'] ?? '',
            packagingQuantity: (float) ($data['quantity'] ?? $data['packaging_quantity'] ?? 1),
            baseUnitQuantity: (float) ($data['base_unit_quantity'] ?? 1),
            baseQuantity: (float) ($data['quantity'] ?? $data['base_quantity'] ?? 1),
            unitPrice: (float) ($data['unit_price'] ?? 0),
            total: (float) ($data['total'] ?? 0),
            packagingName: $data['packaging_name'] ?? null,
            discountPct: (float) ($data['discount_pct'] ?? 0),
            category: $data['category'] ?? '',
        );
    }
}
