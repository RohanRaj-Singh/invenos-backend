<?php

namespace App\Domains\Transactions\DTOs;

/**
 * Describes how a transaction changes a contact's balance.
 */
class ContactBalanceChange
{
    public function __construct(
        public readonly int $contactId,
        public readonly float $amount,        // positive = increase, negative = decrease
        public readonly string $direction,    // 'increase' or 'decrease'
        public readonly string $reason,       // 'sale', 'purchase', 'return', 'payment', etc.
    ) {}
}
