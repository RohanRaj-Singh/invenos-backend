<?php

namespace App\Domains\Transactions\Contracts;

use App\Domains\Transactions\DTOs\ContactBalanceChange;
use App\Domains\Transactions\DTOs\FinancialMovement;
use App\Domains\Transactions\DTOs\InventoryMovement;
use App\Domains\Transactions\DTOs\TransactionData;

/**
 * Each transaction type defines its own effects.
 *
 * The TransactionEngine dispatches to these, so every module
 * (Sale, Purchase, Return, Adjustment, Transfer, Manufacturing)
 * produces inventory movements, financial records, and balance
 * updates through a single, consistent code path.
 */
interface TransactionType
{
    /**
     * Define the inventory movement(s) this transaction produces.
     * Return an array for multi-product transactions.
     *
     * @return InventoryMovement[]
     */
    public function inventoryEffects(TransactionData $data): array;

    /**
     * Define the financial transaction(s) this transaction produces.
     * Return null if no financial effect.
     *
     * @return FinancialMovement[]|null
     */
    public function financialEffects(TransactionData $data): ?array;

    /**
     * Define how the contact balance should change.
     * Return null if no contact effect.
     */
    public function contactEffect(TransactionData $data): ?ContactBalanceChange;

    /**
     * Business rules for validating this transaction type.
     *
     * @return array<string, string> field => rule
     */
    public function validationRules(): array;

    /**
     * Custom validation logic. Throw on failure.
     */
    public function validate(TransactionData $data): void;

    /**
     * Human-readable label for this transaction type.
     */
    public function label(): string;

    /**
     * A unique key for this type (e.g. 'sale', 'purchase', 'sale-return', 'purchase-return').
     */
    public function typeKey(): string;
}
