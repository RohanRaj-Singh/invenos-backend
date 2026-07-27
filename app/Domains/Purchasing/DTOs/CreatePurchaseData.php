<?php

namespace App\Domains\Purchasing\DTOs;

use App\Models\Contact;

class CreatePurchaseData
{
    public function __construct(
        public readonly string $invoiceRef,
        public readonly int $supplierId,
        public readonly string $date,
        public readonly array $items,
        public readonly ?float $discount,
        public readonly float $amountPaid,
        public readonly string $paymentMethod,
        public readonly string $paymentStatus,
        public readonly string $status,
        public readonly ?string $notes,
        public readonly string $createdBy,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            invoiceRef: $data['invoice_ref'],
            supplierId: $data['supplier_id'],
            date: $data['date'],
            items: array_map(fn ($item) => PurchaseItemData::fromArray($item), $data['items'] ?? []),
            discount: $data['discount'] ?? null,
            amountPaid: (float) ($data['amount_paid'] ?? 0),
            paymentMethod: $data['payment_method'] ?? 'cash',
            paymentStatus: $data['payment_status'] ?? 'paid',
            status: $data['status'] ?? 'received',
            notes: $data['notes'] ?? null,
            createdBy: $data['created_by'] ?? 'System',
        );
    }
}
