<?php

namespace App\Domains\Transactions\DTOs;

/**
 * Generic input data for any transaction processed by the TransactionEngine.
 *
 * Each TransactionType implementation interprets these fields
 * according to its own semantics.
 */
class TransactionData
{
    public function __construct(
        /** Unique document number (invoice, bill, return number) */
        public readonly string $documentNumber,

        /** Transaction type key: 'sale', 'purchase', 'sale-return', 'purchase-return', etc. */
        public readonly string $typeKey,

        /** The contact (customer/supplier/patient) this transaction involves */
        public readonly ?int $contactId = null,
        public readonly ?string $contactName = null,

        /** Transaction date */
        public readonly string $date = '',

        /** Line items (array of arrays or DTOs — type-specific interpretation) */
        public readonly array $items = [],

        /** Subtotal before discount */
        public readonly float $subtotal = 0,

        /** Discount amount */
        public readonly float $discount = 0,

        /** Grand total after discount */
        public readonly float $grandTotal = 0,

        /** Amount tendered/paid */
        public readonly float $amountPaid = 0,

        /** Payment method */
        public readonly ?string $paymentMethod = null,

        /** Payment status: paid, partial, unpaid */
        public readonly string $paymentStatus = 'unpaid',

        /** Source of the transaction (pos, clinic, manual) */
        public readonly string $source = 'manual',

        /** Notes / description */
        public readonly ?string $notes = null,

        /** Who created this transaction */
        public readonly ?string $createdBy = null,

        /** Reference to an original document (for returns) */
        public readonly ?int $referenceId = null,
        public readonly ?string $referenceType = null,

        /** Bypass stock check for negative inventory */
        public readonly bool $bypassStockCheck = false,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            documentNumber: $data['document_number'] ?? $data['invoice_number'] ?? '',
            typeKey: $data['type'] ?? $data['type_key'] ?? '',
            contactId: $data['contact_id'] ?? $data['customer_id'] ?? $data['supplier_id'] ?? null,
            contactName: $data['contact_name'] ?? $data['customer_name'] ?? $data['supplier_name'] ?? null,
            date: $data['date'] ?? now()->format('Y-m-d'),
            items: $data['items'] ?? [],
            subtotal: (float) ($data['subtotal'] ?? 0),
            discount: (float) ($data['discount'] ?? 0),
            grandTotal: (float) ($data['grand_total'] ?? 0),
            amountPaid: (float) ($data['amount_paid'] ?? 0),
            paymentMethod: $data['payment_method'] ?? null,
            paymentStatus: $data['payment_status'] ?? 'unpaid',
            source: $data['source'] ?? 'manual',
            notes: $data['notes'] ?? null,
            createdBy: $data['created_by'] ?? null,
            referenceId: $data['reference_id'] ?? null,
            referenceType: $data['reference_type'] ?? null,
            bypassStockCheck: (bool) ($data['bypass_stock_check'] ?? false),
        );
    }
}
