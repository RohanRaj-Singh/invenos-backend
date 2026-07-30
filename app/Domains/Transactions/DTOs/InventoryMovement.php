<?php

namespace App\Domains\Transactions\DTOs;

/**
 * Describes one inventory movement produced by a transaction.
 */
class InventoryMovement
{
    public function __construct(
        public readonly int $productId,
        public readonly float $quantity,          // positive = in, negative = out
        public readonly string $type,              // 'sale', 'purchase', 'sale-return', 'purchase-return', etc.
        public readonly ?string $packagingName = null,
        public readonly ?float $packagingQuantity = null,
        public readonly ?string $reference = null,
        public readonly ?string $notes = null,
        public readonly ?string $user = null,
        public readonly ?int $referenceId = null,
        public readonly ?string $referenceType = null,
        public readonly bool $bypassStockCheck = false,
    ) {}
}
