<?php

namespace App\Console\Commands;

use App\Models\Contact;
use App\Models\FinancialTransaction;
use App\Models\PurchaseBill;
use App\Models\ReturnModel;
use App\Models\Sale;
use Illuminate\Console\Command;

class PartiesReconcileCommand extends Command
{
    protected $signature = 'parties:reconcile {--limit=50 : How many mismatches to print}';

    protected $description = 'Compare contacts.current_balance with the derived party ledger';

    public function handle(): int
    {
        $contacts = Contact::whereNull('deleted_at')->get();
        $ledger = app(\App\Domains\Ledger\PartyLedgerService::class);
        $mismatches = [];

        foreach ($contacts as $contact) {
            $derived = $ledger->closingBalance($contact);
            $stored = round((float) $contact->current_balance, 2);
            $diff = round($stored - $derived, 2);

            if (abs($diff) > 1) {
                $mismatches[] = [$contact->id, $contact->name, $stored, $derived, $diff];
            }
        }

        $this->info('Contacts scanned: ' . $contacts->count());
        $this->info('Mismatches: ' . count($mismatches));

        if ($mismatches) {
            $this->table(
                ['ID', 'Name', 'Stored', 'Derived', 'Difference'],
                array_slice($mismatches, 0, (int) $this->option('limit')),
            );
            $this->comment('Differences are reported, not corrected. Use a separate approved command to fix.');
        }

        return self::SUCCESS;
    }
}
