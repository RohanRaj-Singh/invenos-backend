<?php

namespace App\Domains\Ledger;

use App\Models\FinancialTransaction;
use Illuminate\Database\Eloquent\Builder;

/**
 * The single source of truth for actual cash movements.
 *
 * Rules:
 *  - `invoice` rows are credit memos, not cash. They are excluded everywhere.
 *  - `opening` balances are positions, not cash. They are excluded from periods.
 *  - Every cash event is written once, guarded by a unique `event_key`.
 *  - Corrections are compensating rows (`reversal_of_id`), never deletes.
 */
class CashLedgerService
{
    /** Types that represent money actually moving. */
    public const CASH_TYPES = ['collection', 'payout', 'refund', 'adjustment'];

    public static function isCashType(?string $type): bool
    {
        return in_array($type, self::CASH_TYPES, true);
    }

    /** Base query for real cash rows (excludes invoice memos and opening positions). */
    public function cashQuery(): Builder
    {
        return FinancialTransaction::query()
            ->whereIn('type', self::CASH_TYPES)
            ->where(function (Builder $q) {
                $q->whereNull('reference')->orWhere('reference', '!=', 'OPENING');
            });
    }

    /**
     * Record one cash event. Idempotent when an event_key is supplied.
     *
     * @return array{transaction: FinancialTransaction, created: bool}
     */
    public function record(array $attributes): array
    {
        $key = $attributes['event_key'] ?? null;

        if ($key !== null) {
            $existing = FinancialTransaction::where('event_key', $key)->first();
            if ($existing) {
                return ['transaction' => $existing, 'created' => false];
            }
        }

        return [
            'transaction' => FinancialTransaction::create($attributes),
            'created' => true,
        ];
    }

    /**
     * Reverse a posted cash row by writing an opposite row.
     * The original is retained and marked with `reversed_at`.
     */
    public function reverse(FinancialTransaction $transaction, string $reason, ?string $user = null): FinancialTransaction
    {
        if ($transaction->reversed_at !== null) {
            return $transaction;
        }

        $reversalKey = 'reversal:' . ($transaction->event_key ?: $transaction->id);

        $existing = FinancialTransaction::where('event_key', $reversalKey)->first();
        if ($existing) {
            return $existing;
        }

        $reversal = FinancialTransaction::create([
            'contact_id' => $transaction->contact_id,
            'direction' => $transaction->direction === 'in' ? 'out' : 'in',
            'type' => $transaction->type,
            'date' => now()->toDateString(),
            'amount' => $transaction->amount,
            'method' => $transaction->method,
            'reference' => 'REV-' . $transaction->reference,
            'description' => 'Reversal: ' . $reason,
            'linked_sale_id' => $transaction->linked_sale_id,
            'linked_purchase_id' => $transaction->linked_purchase_id,
            'linked_return_id' => $transaction->linked_return_id,
            'source_type' => $transaction->source_type,
            'source_id' => $transaction->source_id,
            'event_key' => $reversalKey,
            'reversal_of_id' => $transaction->id,
            'created_by' => $user ?? 'System',
        ]);

        $transaction->forceFill(['reversed_at' => now()])->save();

        return $reversal;
    }

    /** Reverse every active cash row attached to a document. */
    public function reverseForDocument(string $column, int $id, ?\App\Models\Contact $contact, string $reason, ?string $user = null): int
    {
        $rows = FinancialTransaction::where($column, $id)
            ->whereIn('type', self::CASH_TYPES)
            ->whereNull('reversed_at')
            ->get();

        foreach ($rows as $row) {
            PartyBalance::reverseCash($contact, $row->type, (float) $row->amount);
            $this->reverse($row, $reason, $user);
        }

        return $rows->count();
    }

    /** Re-post cash rows that a document deletion reversed. */
    public function repostForDocument(string $column, int $id, ?\App\Models\Contact $contact, ?string $user = null): int
    {
        $rows = FinancialTransaction::where($column, $id)
            ->whereIn('type', self::CASH_TYPES)
            ->whereNotNull('reversed_at')
            ->get();

        foreach ($rows as $row) {
            $this->record([
                'contact_id' => $row->contact_id,
                'direction' => $row->direction,
                'type' => $row->type,
                'date' => now()->toDateString(),
                'amount' => $row->amount,
                'method' => $row->method,
                'reference' => 'RESTORE-' . $row->reference,
                'description' => 'Restored: ' . ($row->description ?: $row->reference),
                'linked_sale_id' => $row->linked_sale_id,
                'linked_purchase_id' => $row->linked_purchase_id,
                'linked_return_id' => $row->linked_return_id,
                'source_type' => $row->source_type,
                'source_id' => $row->source_id,
                'event_key' => 'restore:' . $row->id . ':' . now()->format('YmdHis'),
                'created_by' => $user ?? 'System',
            ]);

            PartyBalance::applyCash($contact, $row->type, (float) $row->amount);
        }

        return $rows->count();
    }

    /** Cash on hand before a date, from the ledger only. */
    public function balanceBefore(string $date): float
    {
        return round($this->inBefore($date) - $this->outBefore($date), 2);
    }

    public function inBefore(string $date): float
    {
        return round((float) $this->cashQuery()->where('direction', 'in')
            ->where('date', '<', $date)->sum('amount'), 2);
    }

    public function outBefore(string $date): float
    {
        return round((float) $this->cashQuery()->where('direction', 'out')
            ->where('date', '<', $date)->sum('amount'), 2);
    }

    /**
     * @return array{opening_balance: float, total_in: float, total_out: float, closing_balance: float, rows: array}
     */
    public function summary(string $from, string $to): array
    {
        $opening = $this->balanceBefore($from);

        $rows = $this->cashQuery()
            ->whereBetween('date', [$from, $to])
            ->orderBy('date')->orderBy('id')
            ->get()
            ->map(fn (FinancialTransaction $t) => [
                'id' => $t->id,
                'date' => $t->date->format('Y-m-d'),
                'type' => ucfirst($t->type),
                'description' => $t->description ?: $t->reference,
                'reference' => $t->reference,
                'inflow' => $t->direction === 'in' ? (float) $t->amount : 0.0,
                'outflow' => $t->direction === 'out' ? (float) $t->amount : 0.0,
            ])
            ->all();

        $in = array_sum(array_column($rows, 'inflow'));
        $out = array_sum(array_column($rows, 'outflow'));

        return [
            'opening_balance' => $opening,
            'total_in' => round($in, 2),
            'total_out' => round($out, 2),
            'closing_balance' => round($opening + $in - $out, 2),
            'rows' => $rows,
        ];
    }
}
