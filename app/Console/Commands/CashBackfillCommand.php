<?php

namespace App\Console\Commands;

use App\Domains\Ledger\CashLedgerService;
use App\Domains\Ledger\PartyBalance;
use App\Models\Expense;
use App\Models\FinancialTransaction;
use App\Models\PurchaseBill;
use App\Models\Sale;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class CashBackfillCommand extends Command
{
    protected $signature = 'cash:backfill
        {--execute : Write the rows (default is a dry run)}
        {--adjust-balances : Also move contacts.current_balance for backfilled receipts}';

    protected $description = 'Backfill provable cash rows for sale receipts and expenses';

    public function handle(): int
    {
        $execute = (bool) $this->option('execute');
        $adjust = (bool) $this->option('adjust-balances');
        $ledger = app(CashLedgerService::class);

        $this->info($execute ? 'EXECUTING' : 'DRY RUN — nothing will be written');

        $sales = Sale::whereNull('deleted_at')
            ->where('amount_paid', '>', 0)
            ->orderBy('id')
            ->get();

        $missingTotal = 0.0;
        $ambiguous = 0;
        $alreadyCovered = 0;
        $createCount = 0;

        foreach ($sales as $sale) {
            $linked = (float) FinancialTransaction::where('linked_sale_id', $sale->id)
                ->where('type', 'collection')->sum('amount');
            $missing = round((float) $sale->amount_paid - $linked, 2);

            if ($missing <= 0) {
                $alreadyCovered++;
                continue;
            }

            // If an unlinked payment from the same contact matches this amount
            // on a nearby date, it may be the same money. Do not duplicate it.
            $looksAmbiguous = FinancialTransaction::where('type', 'collection')
                ->whereNull('linked_sale_id')
                ->when($sale->customer_id, fn ($q) => $q->where('contact_id', $sale->customer_id))
                ->where('amount', $missing)
                ->whereBetween('date', [
                    Carbon::parse($sale->date)->subDay()->toDateString(),
                    Carbon::parse($sale->date)->addDay()->toDateString(),
                ])->exists();

            if ($looksAmbiguous) {
                $ambiguous++;
                $this->warn("  ambiguous: {$sale->invoice_number} missing {$missing} (unlinked payment matches)");
                continue;
            }

            $missingTotal += $missing;
            $createCount++;

            if ($execute) {
                $ledger->record([
                    'contact_id' => $sale->customer_id,
                    'direction' => 'in',
                    'type' => 'collection',
                    'date' => Carbon::parse($sale->date)->format('Y-m-d'),
                    'amount' => $missing,
                    'method' => 'cash',
                    'reference' => 'RCPT-' . $sale->invoice_number,
                    'description' => 'Backfilled initial payment for ' . $sale->invoice_number,
                    'linked_sale_id' => $sale->id,
                    'source_type' => 'sale',
                    'source_id' => $sale->id,
                    'event_key' => 'sale-initial:' . $sale->id,
                    'created_by' => 'backfill',
                ]);

                if ($adjust && $sale->customer) {
                    PartyBalance::applyCash($sale->customer, 'collection', $missing);
                }
            }
        }

        $this->table(['Sales', 'Value'], [
            ['scanned', $sales->count()],
            ['already covered', $alreadyCovered],
            ['ambiguous (skipped)', $ambiguous],
            ['receipts to create', $createCount],
            ['amount', number_format($missingTotal, 2)],
        ]);

        // Purchase history cannot be attributed per bill — no column ever existed.
        $purchases = PurchaseBill::whereNull('deleted_at')->where('amount_paid', '>', 0)
            ->selectRaw('COUNT(*) n, SUM(amount_paid) total')->first();
        $this->table(['Purchases', 'Value'], [
            ['bills with payments', $purchases->n ?? 0],
            ['amount', number_format((float) ($purchases->total ?? 0), 2)],
            ['classification', 'UNRECOVERABLE per bill — not backfilled'],
        ]);

        $expenses = Expense::all();
        $expenseMissing = 0;
        foreach ($expenses as $expense) {
            $exists = FinancialTransaction::where('source_type', 'expense')
                ->where('source_id', $expense->id)->exists();
            if ($exists) {
                continue;
            }
            $expenseMissing++;

            if ($execute) {
                $ledger->record([
                    'contact_id' => null,
                    'direction' => 'out',
                    'type' => 'payout',
                    'date' => Carbon::parse($expense->date)->format('Y-m-d'),
                    'amount' => (float) $expense->amount,
                    'method' => $expense->payment_method ?: 'cash',
                    'reference' => $expense->expense_number,
                    'description' => 'Expense: ' . ($expense->paid_to ?: 'N/A'),
                    'source_type' => 'expense',
                    'source_id' => $expense->id,
                    'event_key' => 'expense:' . $expense->id,
                    'created_by' => 'backfill',
                ]);
            }
        }

        $this->table(['Expenses', 'Value'], [
            ['expenses', $expenses->count()],
            ['payouts to create', $expenseMissing],
        ]);

        if (! $execute) {
            $this->newLine();
            $this->comment('Re-run with --execute to write these rows. Balances stay untouched unless --adjust-balances is also given.');
        }

        return self::SUCCESS;
    }
}
