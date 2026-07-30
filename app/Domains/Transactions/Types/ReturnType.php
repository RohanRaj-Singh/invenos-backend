<?php

namespace App\Domains\Transactions\Types;

use App\Domains\Transactions\Contracts\TransactionType;
use App\Domains\Transactions\DTOs\ContactBalanceChange;
use App\Domains\Transactions\DTOs\FinancialMovement;
use App\Domains\Transactions\DTOs\InventoryMovement;
use App\Domains\Transactions\DTOs\TransactionData;

/**
 * Transaction type for Returns.
 *
 * Handles both SALE returns and PURCHASE returns via the `reference_type` field.
 *
 * Sale Return:
 *   - Inventory: increases stock (+quantity)
 *   - Financial: refund/credit note
 *   - Contact: decreases customer's current_balance (they owe less)
 *
 * Purchase Return:
 *   - Inventory: decreases stock (-quantity)
 *   - Financial: supplier credit
 *   - Contact: decreases supplier's current_balance (we owe less)
 */
class ReturnType implements TransactionType
{
    public function typeKey(): string
    {
        return 'return';
    }

    public function label(): string
    {
        // The type field within the data determines sale vs purchase
        return 'Return';
    }

    public function validationRules(): array
    {
        return [
            'document_number' => 'required|string',
            'reference_type' => 'required|in:sale,purchase',
            'items' => 'required|array|min:1',
        ];
    }

    public function validate(TransactionData $data): void
    {
        if (empty($data->items)) {
            throw new \InvalidArgumentException('Return must have at least one item.');
        }

        if (!in_array($data->referenceType, ['sale', 'purchase'])) {
            throw new \InvalidArgumentException('Return reference_type must be "sale" or "purchase".');
        }

        foreach ($data->items as $item) {
            $qty = $item['quantity'] ?? 0;
            if ($qty <= 0) {
                $name = $item['product_name'] ?? $item['productName'] ?? 'Unknown';
                throw new \InvalidArgumentException("Invalid return quantity for '{$name}'.");
            }
            $baseQty = $item['base_quantity'] ?? $item['baseQuantity'] ?? 0;
            if ($baseQty <= 0) {
                $name = $item['product_name'] ?? $item['productName'] ?? 'Unknown';
                throw new \InvalidArgumentException("Invalid base quantity for '{$name}'.");
            }
        }

        // Check that original reference exists (for completed returns)
        // This is checked at the service level when creating, not here.
    }

    public function inventoryEffects(TransactionData $data): array
    {
        $isSaleReturn = $data->referenceType === 'sale';
        $movements = [];

        foreach ($data->items as $item) {
            // Sale return: +quantity (stock goes UP, we got it back)
            // Purchase return: -quantity (stock goes DOWN, we sent it back)
            $baseQty = (float) ($item['base_quantity'] ?? $item['baseQuantity'] ?? 0);
            $quantity = $isSaleReturn ? $baseQty : -$baseQty;

            $movements[] = new InventoryMovement(
                productId: (int) ($item['product_id'] ?? $item['productId'] ?? 0),
                quantity: $quantity,
                type: $isSaleReturn ? 'sale-return' : 'purchase-return',
                packagingName: $item['packaging_name'] ?? $item['packagingName'] ?? null,
                packagingQuantity: (float) ($item['packaging_quantity'] ?? $item['packagingQuantity'] ?? 0),
                reference: $data->documentNumber,
                notes: ($isSaleReturn ? 'Sale return' : 'Purchase return') . ' — ' . ($data->notes ?? ''),
                user: $data->createdBy,
                referenceId: $data->referenceId ?? null,
                referenceType: 'return',
                bypassStockCheck: $data->bypassStockCheck,
            );
        }

        return $movements;
    }

    public function financialEffects(TransactionData $data): ?array
    {
        if (!$data->contactId || $data->grandTotal <= 0) {
            return null;
        }

        $isSaleReturn = $data->referenceType === 'sale';

        return [
            new FinancialMovement(
                contactId: $data->contactId,
                amount: $data->grandTotal,
                direction: $isSaleReturn ? 'out' : 'in',
                type: 'refund',
                method: $data->paymentMethod ?? 'credit',
                linkedSaleId: $isSaleReturn ? $data->referenceId : null,
                description: ($isSaleReturn ? 'Sale return' : 'Purchase return') . " {$data->documentNumber}",
                createdBy: $data->createdBy,
            ),
        ];
    }

    public function contactEffect(TransactionData $data): ?ContactBalanceChange
    {
        if (!$data->contactId || $data->grandTotal <= 0) {
            return null;
        }

        $isSaleReturn = $data->referenceType === 'sale';

        // Sale return: customer owes LESS (decrease balance)
        // Purchase return: we owe LESS (decrease supplier balance)
        return new ContactBalanceChange(
            contactId: $data->contactId,
            amount: $data->grandTotal,
            direction: 'decrease',
            reason: $isSaleReturn ? 'sale-return' : 'purchase-return',
        );
    }
}
