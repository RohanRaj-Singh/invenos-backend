<?php

namespace App\Console\Commands;

use App\Models\InventoryTransaction;
use App\Models\Product;
use Illuminate\Console\Command;

class StockReconcileCommand extends Command
{
    protected $signature = 'stock:reconcile {--limit=50 : How many mismatches to print}';

    protected $description = 'Compare products.stock_quantity with the signed inventory ledger';

    public function handle(): int
    {
        $rows = Product::query()
            ->leftJoin('inventory_transactions as it', 'it.product_id', '=', 'products.id')
            ->groupBy('products.id', 'products.name', 'products.base_unit_id', 'products.stock_quantity')
            ->selectRaw('products.id, products.name, products.base_unit_id, products.stock_quantity, COALESCE(SUM(it.quantity),0) as ledger_qty')
            ->havingRaw('ABS(products.stock_quantity - COALESCE(SUM(it.quantity),0)) > 0.005')
            ->get();

        $negative = Product::where('stock_quantity', '<', 0)->count();
        $noInitial = Product::where('stock_quantity', '<>', 0)
            ->whereNotExists(function ($q) {
                $q->selectRaw('1')->from('inventory_transactions')
                    ->whereColumn('inventory_transactions.product_id', 'products.id')
                    ->where('inventory_transactions.reference', 'INITIAL');
            })->count();

        $this->info('Products scanned: ' . Product::count());
        $this->info('Mismatches: ' . $rows->count());
        $this->info('Negative stock: ' . $negative);
        $this->info('Stock without an INITIAL movement: ' . $noInitial);

        if ($rows->isNotEmpty()) {
            $this->table(
                ['ID', 'Product', 'Unit', 'Stored', 'Ledger', 'Diff'],
                $rows->take((int) $this->option('limit'))->map(fn ($r) => [
                    $r->id,
                    $r->name,
                    $r->base_unit_id,
                    $r->stock_quantity,
                    $r->ledger_qty,
                    round((float) $r->stock_quantity - (float) $r->ledger_qty, 2),
                ])->all(),
            );
            $this->comment('Differences are reported, not corrected.');
        }

        return self::SUCCESS;
    }
}
