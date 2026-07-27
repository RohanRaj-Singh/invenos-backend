<?php

namespace App\Domains\Sales\DTOs;

class CreateSaleReturnData
{
    public function __construct(
        public readonly string $returnNumber,
        public readonly string $date,
        public readonly int $originalSaleId,
        public readonly array $items,
        public readonly float $refundTotal,
        public readonly string $refundMethod,
        public readonly string $createdBy,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            returnNumber: $data['return_number'],
            date: $data['date'],
            originalSaleId: (int) $data['original_sale_id'],
            items: array_map(fn ($i) => SaleReturnItemData::fromArray($i), $data['items'] ?? []),
            refundTotal: (float) ($data['refund_total'] ?? 0),
            refundMethod: $data['refund_method'] ?? 'cash',
            createdBy: $data['created_by'],
        );
    }
}

class SaleReturnItemData
{
    public function __construct(
        public readonly int $productId,
        public readonly string $productName,
        public readonly float $quantity,
        public readonly float $unitPrice,
        public readonly float $refundAmount,
        public readonly string $reason,
        public readonly string $condition,
        public readonly bool $restock,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            productId: (int) $data['product_id'],
            productName: $data['product_name'] ?? '',
            quantity: (float) ($data['quantity'] ?? 0),
            unitPrice: (float) ($data['unit_price'] ?? 0),
            refundAmount: (float) ($data['refund_amount'] ?? 0),
            reason: $data['reason'] ?? 'other',
            condition: $data['condition'] ?? 'resellable',
            restock: $data['restock'] ?? true,
        );
    }
}
