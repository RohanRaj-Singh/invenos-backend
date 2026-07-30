<?php

namespace App\Domains\Transactions\Services;

use App\Domains\Inventory\Services\InventoryService;
use App\Domains\Transactions\Contracts\TransactionType;
use App\Domains\Transactions\DTOs\TransactionData;
use App\Models\Contact;
use App\Models\FinancialTransaction;
use Illuminate\Support\Facades\DB;

/**
 * Universal transaction engine.
 *
 * Every business transaction (Sale, Purchase, Return, Adjustment, Transfer,
 * Manufacturing) passes through this single engine. Each type implements
 * the TransactionType interface to declare its effects.
 *
 * The engine:
 *  1. Validates the transaction data against the type's rules
 *  2. Acquires row-level locks on affected records
 *  3. Applies inventory movements via InventoryService
 *  4. Records financial transactions
 *  5. Updates contact balances
 *  6. Returns all created records
 */
class TransactionEngine
{
    /** @var array<string, TransactionType> */
    private array $types = [];

    public function __construct(
        private readonly InventoryService $inventoryService,
    ) {}

    /**
     * Register a transaction type.
     */
    public function registerType(TransactionType $type): void
    {
        $this->types[$type->typeKey()] = $type;
    }

    /**
     * Get a registered type by key.
     */
    public function getType(string $key): TransactionType
    {
        if (!isset($this->types[$key])) {
            throw new \InvalidArgumentException("Unknown transaction type: {$key}");
        }
        return $this->types[$key];
    }

    /**
     * Validate transaction data against the type's business rules.
     */
    public function validate(TransactionData $data): void
    {
        $type = $this->getType($data->typeKey);
        $type->validate($data);
    }

    /**
     * Preview what effects a transaction would have (no side effects).
     *
     * Returns a structured impact report showing inventory, financial,
     * and balance changes that would occur.
     */
    public function preview(TransactionData $data): array
    {
        $type = $this->getType($data->typeKey);

        $inventoryEffects = $type->inventoryEffects($data);
        $financialEffects = $type->financialEffects($data);
        $contactEffect = $type->contactEffect($data);

        $preview = [
            'type' => $type->typeKey(),
            'label' => $type->label(),
            'document_number' => $data->documentNumber,
        ];

        if (!empty($inventoryEffects)) {
            $preview['inventory'] = array_map(fn ($m) => [
                'product_id' => $m->productId,
                'quantity' => $m->quantity,
                'type' => $m->type,
            ], $inventoryEffects);
        }

        if ($financialEffects !== null) {
            $preview['financial'] = array_map(fn ($m) => [
                'amount' => $m->amount,
                'direction' => $m->direction,
                'method' => $m->method,
                'type' => $m->type,
            ], $financialEffects);
        }

        if ($contactEffect !== null) {
            $preview['contact'] = [
                'contact_id' => $contactEffect->contactId,
                'amount' => $contactEffect->amount,
                'direction' => $contactEffect->direction,
                'reason' => $contactEffect->reason,
            ];
        }

        return $preview;
    }

    /**
     * Execute a transaction: validate, apply inventory, record financials,
     * update balances — all inside a single database transaction.
     *
     * Returns an array of created records.
     */
    public function process(TransactionData $data): array
    {
        $type = $this->getType($data->typeKey);

        // Validate first
        $type->validate($data);

        return DB::transaction(function () use ($data, $type) {
            $results = [];

            // 1. Lock the contact row if applicable
            $contact = null;
            if ($data->contactId && $data->contactId > 0) {
                $contact = Contact::lockForUpdate()->find($data->contactId);
            }

            // 2. Apply inventory movements
            $inventoryMovements = $type->inventoryEffects($data);
            foreach ($inventoryMovements as $movement) {
                $results['inventory'][] = $this->inventoryService->applyMovement(
                    productId: $movement->productId,
                    type: $movement->type,
                    quantity: $movement->quantity,
                    packagingName: $movement->packagingName,
                    packagingQuantity: $movement->packagingQuantity,
                    reference: $movement->reference ?? $data->documentNumber,
                    notes: $movement->notes ?? $type->label() . ' — ' . ($data->notes ?? ''),
                    user: $movement->user ?? $data->createdBy ?? 'System',
                    referenceType: $movement->referenceType ?? $type->typeKey(),
                    referenceId: $movement->referenceId ?? 0,
                    bypassStockCheck: $movement->bypassStockCheck || $data->bypassStockCheck,
                );
            }

            // 3. Apply financial movements
            $financialEffects = $type->financialEffects($data);
            if ($financialEffects !== null) {
                foreach ($financialEffects as $movement) {
                    $results['financial'][] = FinancialTransaction::create([
                        'contact_id' => $movement->contactId,
                        'direction' => $movement->direction,
                        'type' => $movement->type,
                        'amount' => $movement->amount,
                        'method' => $movement->method,
                        'linked_sale_id' => $movement->linkedSaleId,
                        'linked_purchase_id' => $movement->linkedPurchaseId,
                        'description' => $movement->description ?? $type->label() . ' — ' . $data->documentNumber,
                        'created_by' => $movement->createdBy ?? $data->createdBy ?? 'System',
                    ]);
                }
            }

            // 4. Apply contact balance change
            $contactEffect = $type->contactEffect($data);
            if ($contactEffect !== null && $contact) {
                if ($contactEffect->direction === 'increase') {
                    $contact->increment('current_balance', $contactEffect->amount);
                } else {
                    $contact->decrement('current_balance', $contactEffect->amount);
                }
                $results['balance_updated'] = true;
            }

            return $results;
        });
    }
}
