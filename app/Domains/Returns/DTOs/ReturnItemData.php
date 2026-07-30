<?php

namespace App\Domains\Returns\DTOs;

/**
 * Data for one return line item.
 */
class ReturnItemData
{
    public function __construct(
        public readonly int $referenceItemId,      // SaleItem or PurchaseBillItem ID
        public readonly string $referenceItemType, // 'sale_item' or 'purchase_bill_item'
        public readonly int $productId,
        public readonly string $productName,
        public readonly ?int $sellingUnitId,
        public readonly ?string $packagingName,
        public readonly float $quantity,
        public readonly float $baseQuantity,
        public readonly float $unitPrice,
        public readonly float $total,
        public readonly ?int $reasonId,
        public readonly ?string $notes,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            referenceItemId: (int) ($data['reference_item_id'] ?? $data['sale_item_id'] ?? $data['purchase_item_id'] ?? 0),
            referenceItemType: $data['reference_item_type'] ?? ($data['item_type'] ?? 'sale_item'),
            productId: (int) ($data['product_id'] ?? 0),
            productName: $data['product_name'] ?? 'Unknown',
            sellingUnitId: isset($data['selling_unit_id']) ? (int) $data['selling_unit_id'] : null,
            packagingName: $data['packaging_name'] ?? null,
            quantity: (float) ($data['quantity'] ?? 0),
            baseQuantity: (float) ($data['base_quantity'] ?? 0),
            unitPrice: (float) ($data['unit_price'] ?? 0),
            total: (float) ($data['total'] ?? 0),
            reasonId: isset($data['reason_id']) ? (int) $data['reason_id'] : null,
            notes: $data['notes'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'reference_item_id' => $this->referenceItemId,
            'reference_item_type' => $this->referenceItemType,
            'product_id' => $this->productId,
            'product_name' => $this->productName,
            'selling_unit_id' => $this->sellingUnitId,
            'packaging_name' => $this->packagingName,
            'quantity' => $this->quantity,
            'base_quantity' => $this->baseQuantity,
            'unit_price' => $this->unitPrice,
            'total' => $this->total,
            'reason_id' => $this->reasonId,
            'notes' => $this->notes,
        ];
    }
}
