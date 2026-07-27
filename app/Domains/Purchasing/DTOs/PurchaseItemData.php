<?php

namespace App\Domains\Purchasing\DTOs;

class PurchaseItemData
{
    public function __construct(
        public readonly int $productId,
        public readonly string $productName,
        public readonly float $purchasePackQty,
        public readonly float $purchaseQuantity,
        public readonly float $unitCost,
        public readonly float $totalCost,
        public readonly ?string $packName = null,
        public readonly ?float $discountPct = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            productId: (int) $data['product_id'],
            productName: $data['product_name'] ?? '',
            purchasePackQty: (float) ($data['purchase_pack_qty'] ?? 1),
            purchaseQuantity: (float) ($data['purchase_quantity'] ?? 1),
            unitCost: (float) ($data['unit_cost'] ?? 0),
            totalCost: (float) ($data['total_cost'] ?? 0),
            packName: $data['purchase_pack_name'] ?? null,
            discountPct: isset($data['discount_pct']) ? (float) $data['discount_pct'] : null,
        );
    }
}
