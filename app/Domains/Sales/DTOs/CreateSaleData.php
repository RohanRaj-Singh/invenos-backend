<?php

namespace App\Domains\Sales\DTOs;

class CreateSaleData
{
    public function __construct(
        public readonly string $invoiceNumber,
        public readonly int $customerId,
        public readonly string $customerName,
        public readonly string $date,
        public readonly array $items,
        public readonly float $discount,
        public readonly float $amountPaid,
        public readonly string $paymentMethod,
        public readonly string $paymentStatus,
        public readonly string $source,
        public readonly ?string $notes,
        public readonly string $createdBy,
    ) {}

    public static function fromRequest(array $data): self
    {
        $customerId = !empty($data['customer_id']) ? (int) $data['customer_id'] : 0;
        $customerName = $data['customer_name'] ?? '';
        if (!$customerName && $customerId > 0) {
            $customerName = \App\Models\Contact::find($customerId)?->name ?? 'Walk-in Customer';
        }
        if (!$customerName) {
            $customerName = 'Walk-in Customer';
        }

        return new self(
            invoiceNumber: $data['invoice_number'],
            customerId: $customerId,
            customerName: $customerName,
            date: $data['date'],
            items: array_map(fn ($item) => SaleItemData::fromArray($item), $data['items'] ?? []),
            discount: (float) ($data['discount'] ?? 0),
            amountPaid: (float) ($data['amount_paid'] ?? 0),
            paymentMethod: $data['payment_method'] ?? 'cash',
            paymentStatus: $data['payment_status'] ?? 'paid',
            source: $data['source'] ?? 'pos',
            notes: $data['notes'] ?? null,
            createdBy: $data['created_by'] ?? 'System',
        );
    }
}
