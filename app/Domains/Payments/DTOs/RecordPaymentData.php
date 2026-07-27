<?php

namespace App\Domains\Payments\DTOs;

class RecordPaymentData
{
    public function __construct(
        public readonly string $transactionType,
        public readonly int $transactionId,
        public readonly float $amount,
        public readonly string $method,
        public readonly ?string $reference,
        public readonly string $createdBy,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            transactionType: $data['transaction_type'],
            transactionId: (int) $data['transaction_id'],
            amount: (float) $data['amount'],
            method: $data['method'] ?? 'cash',
            reference: $data['reference'] ?? null,
            createdBy: $data['created_by'],
        );
    }
}
