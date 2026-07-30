<?php

namespace App\Domains\Transactions\Types;

use App\Domains\Transactions\Contracts\TransactionType;
use App\Domains\Transactions\DTOs\ContactBalanceChange;
use App\Domains\Transactions\DTOs\FinancialMovement;
use App\Domains\Transactions\DTOs\InventoryMovement;
use App\Domains\Transactions\DTOs\TransactionData;

/**
 * Transaction type for Sales.
 *
 * - Inventory: decreases stock (-quantity per item)
 * - Financial: records an invoice financial transaction
 * - Contact: increases customer's current_balance (they owe more)
 */
class SaleType implements TransactionType
{
    public function typeKey(): string
    {
        return 'sale';
    }

    public function label(): string
    {
        return 'Sale';
    }

    public function validationRules(): array
    {
        return [
            'document_number' => 'required|string',
            'items' => 'required|array|min:1',
        ];
    }

    public function validate(TransactionData $data): void
    {
        if (empty($data->items)) {
            throw new \InvalidArgumentException('Sale must have at least one item.');
        }

        foreach ($data->items as $item) {
            $baseQty = $item['base_quantity'] ?? $item['baseQuantity'] ?? 0;
            if ($baseQty <= 0) {
                $name = $item['product_name'] ?? $item['productName'] ?? 'Unknown';
                throw new \InvalidArgumentException("Invalid quantity for product '{$name}'.");
            }
            $price = $item['unit_price'] ?? $item['unitPrice'] ?? 0;
            if ($price < 0) {
                $name = $item['product_name'] ?? $item['productName'] ?? 'Unknown';
                throw new \InvalidArgumentException("Unit price cannot be negative for '{$name}'.");
            }
        }
    }

    public function inventoryEffects(TransactionData $data): array
    {
        $movements = [];
        foreach ($data->items as $item) {
            $movements[] = new InventoryMovement(
                productId: (int) ($item['product_id'] ?? $item['productId'] ?? 0),
                quantity: -(float) ($item['base_quantity'] ?? $item['baseQuantity'] ?? 0),
                type: 'sale',
                packagingName: $item['packaging_name'] ?? $item['packagingName'] ?? null,
                packagingQuantity: (float) ($item['packaging_quantity'] ?? $item['packagingQuantity'] ?? 0),
                reference: $data->documentNumber,
                user: $data->createdBy,
                referenceId: $data->referenceId ?? null,
                referenceType: 'sale',
                bypassStockCheck: $data->bypassStockCheck,
            );
        }
        return $movements;
    }

    public function financialEffects(TransactionData $data): ?array
    {
        // Sales create an invoice financial record for the receivable
        if ($data->contactId && $data->grandTotal > 0) {
            return [
                new FinancialMovement(
                    contactId: $data->contactId,
                    amount: $data->grandTotal,
                    direction: 'in',
                    type: 'invoice',
                    method: $data->paymentMethod ?? 'invoice',
                    description: "Sale {$data->documentNumber}",
                    createdBy: $data->createdBy,
                ),
            ];
        }
        return null;
    }

    public function contactEffect(TransactionData $data): ?ContactBalanceChange
    {
        if (!$data->contactId || $data->grandTotal <= 0) {
            return null;
        }

        return new ContactBalanceChange(
            contactId: $data->contactId,
            amount: $data->grandTotal,
            direction: 'increase',
            reason: 'sale',
        );
    }
}
