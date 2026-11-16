<?php

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\InventoryTransaction;

echo "products: ".Product::withArchived()->count().PHP_EOL;
foreach (Product::withArchived()->withTrashed()->get() as $p) {
    echo sprintf(
        "  #%d %-12s stock=%-8s unit=%-6s created=%s compositions=%d movements=%d%s",
        $p->id,
        $p->name,
        $p->stock_quantity,
        $p->base_unit_id,
        $p->created_at,
        ProductComposition::where('product_id', $p->id)->count(),
        InventoryTransaction::where('product_id', $p->id)->count(),
        PHP_EOL
    );
}

echo "compositions: ".ProductComposition::count().PHP_EOL;
foreach (ProductComposition::with('items')->get() as $c) {
    echo sprintf(
        "  #%d product=%d kind=%s v%d active=%s items=%d%s",
        $c->id, $c->product_id, $c->kind, $c->version,
        $c->is_active ? 'yes' : 'no', $c->items->count(), PHP_EOL
    );
}

echo "movements: ".InventoryTransaction::count().PHP_EOL;
echo "sales: ".\App\Models\Sale::withTrashed()->count().PHP_EOL;
echo "composition runs: ".\App\Models\CompositionRun::count().PHP_EOL;
echo "returns: ".\App\Models\ReturnModel::count().PHP_EOL;

echo PHP_EOL."-- ledger reconciliation per product --".PHP_EOL;
foreach (Product::withArchived()->withTrashed()->get() as $p) {
    $ledger = (float) InventoryTransaction::where('product_id', $p->id)->sum('quantity');
    $diff = round((float) $p->stock_quantity - $ledger, 6);
    echo sprintf(
        "  #%d %-12s stored=%-8s ledger=%-10s diff=%s%s",
        $p->id, $p->name, $p->stock_quantity, $ledger, $diff,
        abs($diff) > 0.000001 ? '  <-- MISMATCH' : '  ok'
    ).PHP_EOL;
}

echo PHP_EOL."-- movements for #4 --".PHP_EOL;
foreach (InventoryTransaction::where('product_id', 4)->get() as $t) {
    echo sprintf("  %s qty=%s ref=%s type=%s%s", $t->created_at, $t->quantity, $t->reference, $t->type, PHP_EOL);
}
