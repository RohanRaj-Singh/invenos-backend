<?php

namespace App\Domains\Ledger;

use App\Models\Contact;

/**
 * Keeps `contacts.current_balance` as a cache of the party ledger.
 *
 * Sign convention: positive = the customer owes us / we owe the supplier.
 * Every cash settlement moves the balance toward zero; refunds move it away
 * from zero (they settle a credit owed to the customer or supplier).
 */
class PartyBalance
{
    /** Apply the party effect of a cash event. */
    public static function applyCash(?Contact $contact, string $type, float $amount, bool $reverse = false): void
    {
        if (! $contact) {
            return;
        }

        $delta = ($type === 'refund' ? 1 : -1) * $amount;
        if ($reverse) {
            $delta = -$delta;
        }

        static::apply($contact, $delta);
    }

    /** Apply a document effect: invoice +, return −. */
    public static function apply(?Contact $contact, float $delta): void
    {
        if (! $contact || $delta === 0.0) {
            return;
        }

        $contact->current_balance = (float) $contact->current_balance + $delta;
        $contact->save();
    }

    /** Reverse one (type, direction, amount) cash row. */
    public static function reverseCash(?Contact $contact, string $type, float $amount): void
    {
        static::applyCash($contact, $type, $amount, reverse: true);
    }
}
