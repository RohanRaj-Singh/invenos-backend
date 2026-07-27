<?php

namespace App\Domains\Products\DTOs;

class CreateProductData
{
    public function __construct(
        public readonly string $name,
        public readonly string $sku,
        public readonly ?string $barcode,
        public readonly ?int $categoryId,
        public readonly string $description,
        public readonly string $baseUnitId,
        public readonly bool $trackInventory,
        public readonly float $lowStockThreshold,
        public readonly ?string $supplierName,
        public readonly ?string $location,
        public readonly ?string $createdBy,
        public readonly array $sellingUnits = [],
        public readonly ?array $purchaseConfig = null,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'],
            sku: $data['sku'],
            barcode: $data['barcode'] ?? null,
            categoryId: $data['category_id'] ?? null,
            description: $data['description'] ?? '',
            baseUnitId: $data['base_unit_id'] ?? 'piece',
            trackInventory: $data['track_inventory'] ?? true,
            lowStockThreshold: (float) ($data['low_stock_threshold'] ?? 10),
            supplierName: $data['supplier_name'] ?? null,
            location: $data['location'] ?? null,
            createdBy: $data['created_by'] ?? null,
            sellingUnits: $data['selling_units'] ?? [],
            purchaseConfig: $data['purchase_config'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'category_id' => $this->categoryId,
            'description' => $this->description,
            'base_unit_id' => $this->baseUnitId,
            'track_inventory' => $this->trackInventory,
            'low_stock_threshold' => $this->lowStockThreshold,
            'supplier_name' => $this->supplierName,
            'location' => $this->location,
            'created_by' => $this->createdBy,
        ];
    }
}
