<?php

namespace App\Domains\Clinic\DTOs;

/**
 * Represents one prescribed medicine during a consultation.
 * The product + selling unit info is used to create a SaleItem.
 * The clinical fields (dosage, frequency, etc.) go to PrescriptionItem.
 */
class MedicationItemData
{
    public function __construct(
        public readonly int $productId,
        public readonly ?int $sellingUnitId,
        public readonly float $packagingQuantity,
        public readonly float $baseUnitQuantity,
        public readonly float $unitPrice,
        public readonly float $total,
        public readonly string $packagingName,
        public readonly string $dosage,
        public readonly string $frequency,
        public readonly string $duration,
        public readonly string $instructions,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            productId: (int) ($data['product_id'] ?? 0),
            sellingUnitId: isset($data['selling_unit_id']) ? (int) $data['selling_unit_id'] : null,
            packagingQuantity: (float) ($data['packaging_quantity'] ?? $data['quantity'] ?? 1),
            baseUnitQuantity: (float) ($data['base_unit_quantity'] ?? 1),
            unitPrice: (float) ($data['unit_price'] ?? 0),
            total: (float) ($data['total'] ?? 0),
            packagingName: $data['packaging_name'] ?? 'Unit',
            dosage: $data['dosage'] ?? '1',
            frequency: $data['frequency'] ?? 'Once daily',
            duration: $data['duration'] ?? '7 days',
            instructions: $data['instructions'] ?? $data['notes'] ?? '',
        );
    }

    /**
     * Convert to the SaleItemData format expected by SaleService.
     */
    public function toSaleItemData(): array
    {
        return [
            'product_id' => $this->productId,
            'selling_unit_id' => $this->sellingUnitId,
            'packaging_quantity' => $this->packagingQuantity,
            'base_unit_quantity' => $this->baseUnitQuantity,
            'unit_price' => $this->unitPrice,
            'total' => $this->total,
            'packaging_name' => $this->packagingName,
            'quantity' => $this->packagingQuantity,
        ];
    }
}
