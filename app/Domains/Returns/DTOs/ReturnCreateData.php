<?php

namespace App\Domains\Returns\DTOs;

/**
 * Input data for creating or previewing a return.
 */
class ReturnCreateData
{
    public function __construct(
        public readonly string $type,              // 'SALE' or 'PURCHASE'
        public readonly int $referenceId,          // Sale or PurchaseBill ID
        public readonly string $referenceType,     // 'sale' or 'purchase_bill'
        public readonly string $returnNumber,
        public readonly string $returnDate,
        public readonly int $contactId,
        public readonly ?string $contactName,
        public readonly ?int $reasonId,
        public readonly ?string $reasonNote,

        /** Array of ReturnItemData */
        public readonly array $items,

        public readonly float $subtotal,
        public readonly float $discount,
        public readonly float $grandTotal,
        public readonly float $refundAmount,
        public readonly string $refundMethod,
        public readonly ?string $notes,
        public readonly ?string $createdBy,
    ) {}

    public static function fromRequest(array $data): self
    {
        $items = [];
        foreach ($data['items'] ?? [] as $item) {
            $items[] = ReturnItemData::fromArray($item);
        }

        return new self(
            type: $data['type'] ?? 'SALE',
            referenceId: (int) ($data['reference_id'] ?? 0),
            referenceType: $data['reference_type'] ?? 'sale',
            returnNumber: $data['return_number'] ?? '',
            returnDate: $data['return_date'] ?? now()->format('Y-m-d'),
            contactId: (int) ($data['contact_id'] ?? 0),
            contactName: $data['contact_name'] ?? null,
            reasonId: isset($data['reason_id']) ? (int) $data['reason_id'] : null,
            reasonNote: $data['reason_note'] ?? null,
            items: $items,
            subtotal: (float) ($data['subtotal'] ?? 0),
            discount: (float) ($data['discount'] ?? 0),
            grandTotal: (float) ($data['grand_total'] ?? 0),
            refundAmount: (float) ($data['refund_amount'] ?? 0),
            refundMethod: $data['refund_method'] ?? 'cash',
            notes: $data['notes'] ?? null,
            createdBy: $data['created_by'] ?? auth()->user()->name ?? 'System',
        );
    }

    /**
     * Convert to TransactionData for the TransactionEngine.
     */
    public function toTransactionData(string $documentNumber): \App\Domains\Transactions\DTOs\TransactionData
    {
        $itemData = array_map(fn ($i) => $i->toArray(), $this->items);

        return new \App\Domains\Transactions\DTOs\TransactionData(
            documentNumber: $documentNumber,
            typeKey: 'return',
            contactId: $this->contactId,
            contactName: $this->contactName,
            date: $this->returnDate,
            items: $itemData,
            subtotal: $this->subtotal,
            discount: $this->discount,
            grandTotal: $this->grandTotal,
            amountPaid: 0,
            paymentMethod: $this->refundMethod,
            paymentStatus: 'paid',
            source: 'return',
            notes: $this->notes,
            createdBy: $this->createdBy,
            referenceId: $this->referenceId,
            referenceType: $this->referenceType,
        );
    }
}
