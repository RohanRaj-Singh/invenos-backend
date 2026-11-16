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
        public readonly bool $restock = true,
        /**
         * Explicit recovered material for composition sale lines, keyed by the
         * consumed composition run item:
         * [['composition_run_item_id' => int, 'quantity' => float], ...]
         *
         * Empty by default — a commercial refund never restores components.
         */
        public readonly array $materialRecoveries = [],
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
            restock: filter_var($data['restock'] ?? true, FILTER_VALIDATE_BOOLEAN),
            materialRecoveries: self::normalizeRecoveries($data['material_recoveries'] ?? []),
        );
    }

    /**
     * Only the run-item id and the verified quantity are accepted from the
     * client. Component identity, unit, cost and eligibility are resolved
     * server-side from the immutable run snapshot.
     *
     * @return array<int, array{composition_run_item_id: int, quantity: float}>
     */
    private static function normalizeRecoveries(mixed $recoveries): array
    {
        if (! is_array($recoveries)) {
            return [];
        }

        $normalized = [];

        foreach ($recoveries as $recovery) {
            if (! is_array($recovery)) {
                continue;
            }

            $runItemId = (int) ($recovery['composition_run_item_id'] ?? 0);
            $quantity = (float) ($recovery['quantity'] ?? $recovery['recovered_quantity'] ?? 0);

            if ($runItemId <= 0) {
                continue;
            }

            $normalized[] = [
                'composition_run_item_id' => $runItemId,
                'quantity' => $quantity,
            ];
        }

        return $normalized;
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
            'restock' => $this->restock,
        ];
    }

    /**
     * Explicit recovered material rows declared for this line.
     *
     * @return array<int, array{composition_run_item_id: int, quantity: float}>
     */
    public function recoveries(): array
    {
        return $this->materialRecoveries;
    }
}
