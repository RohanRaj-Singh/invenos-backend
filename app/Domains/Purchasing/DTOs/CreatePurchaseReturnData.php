<?php

namespace App\Domains\Purchasing\DTOs;

class CreatePurchaseReturnData
{
    public function __construct(
        public readonly string $returnRef,
        public readonly string $date,
        public readonly int $originalPurchaseId,
        public readonly array $items,
        public readonly float $refundTotal,
        public readonly string $refundMethod,
        public readonly string $createdBy,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            returnRef: $data['return_ref'],
            date: $data['date'],
            originalPurchaseId: (int) $data['original_purchase_id'],
            items: array_map(fn ($i) => PurchaseReturnItemData::fromArray($i), $data['items'] ?? []),
            refundTotal: (float) ($data['refund_total'] ?? 0),
            refundMethod: $data['refund_method'] ?? 'cash',
            createdBy: $data['created_by'],
        );
    }
}

class PurchaseReturnItemData
{
    public function __construct(
        public readonly int $productId,
        public readonly string $productName,
        public readonly float $quantity,
        public readonly float $unitCost,
        public readonly float $refundAmount,
        public readonly string $condition,
        public readonly bool $restock,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            productId: (int) $data['product_id'],
            productName: $data['product_name'] ?? '',
            quantity: (float) ($data['quantity'] ?? 0),
            unitCost: (float) ($data['unit_cost'] ?? 0),
            refundAmount: (float) ($data['refund_amount'] ?? 0),
            condition: $data['condition'] ?? 'resellable',
            restock: $data['restock'] ?? true,
        );
    }
}
