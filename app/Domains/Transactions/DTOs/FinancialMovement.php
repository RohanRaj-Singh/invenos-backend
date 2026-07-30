<?php

namespace App\Domains\Transactions\DTOs;

/**
 * Describes a financial transaction produced by a business transaction.
 */
class FinancialMovement
{
    public function __construct(
        public readonly int $contactId,
        public readonly float $amount,
        public readonly string $direction,    // 'in' or 'out'
        public readonly string $type,         // 'invoice', 'payment', 'refund', 'credit'
        public readonly string $method,       // 'cash', 'card', 'transfer', etc.
        public readonly ?int $linkedSaleId = null,
        public readonly ?int $linkedPurchaseId = null,
        public readonly ?string $description = null,
        public readonly ?string $createdBy = null,
    ) {}
}
