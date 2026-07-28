<?php

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$bill = App\Models\PurchaseBill::with('items')->find(13);
echo "=== PURCHASE BILL VERIFICATION ===\n";
echo "Bill ID: {$bill->id}\n";
echo "Invoice: {$bill->invoice_ref}\n";
echo "Subtotal: {$bill->subtotal}\n";
echo "Total: {$bill->total_amount}\n";
echo "Paid: {$bill->amount_paid}\n";
echo "Outstanding: {$bill->outstanding_balance}\n";
echo "Status: {$bill->status}\n";

foreach ($bill->items as $item) {
    echo "\n--- Purchase Item ---\n";
    echo "Product: {$item->product_name} (ID: {$item->product_id})\n";
    echo "Pack: {$item->purchase_pack_name}, Pack Qty: {$item->purchase_pack_qty}\n";
    echo "Purchase Qty: {$item->purchase_quantity} strips\n";
    $base = $item->purchase_pack_qty * $item->purchase_quantity;
    echo "Base Qty: {$base} capsules\n";
    echo "Unit Cost: Rs. {$item->unit_cost}\n";
    echo "Total Cost: Rs. {$item->total_cost}\n";
}

echo "\n=== PRODUCT VERIFICATION ===\n";
$product = App\Models\Product::with('sellingUnits')->find(22);
echo "Product: {$product->name}\n";
echo "Stock: {$product->stock_quantity} (expected: 50)\n";
echo "Last Purchase Cost: " . var_export($product->last_purchase_cost, true) . " (expected: 8.5)\n";
echo "Status: {$product->status} (expected: in-stock)\n";

echo "\n=== SELLING UNITS ===\n";
foreach ($product->sellingUnits as $u) {
    echo "  {$u->name}: Qty {$u->quantity}, Price Rs. {$u->sale_price}\n";
}

echo "\n=== INVENTORY TRANSACTION ===\n";
$txn = App\Models\InventoryTransaction::where('product_id', 22)->first();
if ($txn) {
    echo "ID: {$txn->id}\n";
    echo "Type: {$txn->type} (expected: purchase)\n";
    echo "Quantity: {$txn->quantity} (expected: 50)\n";
    echo "Running Balance: {$txn->running_balance} (expected: 50)\n";
    echo "Reference: {$txn->reference}\n";
    echo "Reference Type: {$txn->reference_type} (expected: purchase)\n";
    echo "Reference ID: {$txn->reference_id} (expected: 13)\n";
    echo "Unit: {$txn->unit}\n";
    echo "Packaging Name: " . var_export($txn->packaging_name, true) . "\n";
    echo "Packaging Quantity: " . var_export($txn->packaging_quantity, true) . "\n";
} else {
    echo "NO INVENTORY TRANSACTION FOUND!\n";
}

echo "\n=== SUPPLIER VERIFICATION ===\n";
$supplier = App\Models\Contact::find(16);
echo "Supplier: {$supplier->name}\n";
echo "Current Balance: " . var_export($supplier->current_balance, true) . " (expected: 425)\n";

echo "\n=== INTEGRITY CROSS-CHECK ===\n";
$stockCheck = ($product->stock_quantity == ($txn ? $txn->running_balance : -1)) ? 'PASS' : 'FAIL';
echo "Stock vs Running Balance: {$stockCheck}\n";

$costCheck = ($bill->total_amount == 425.00) ? 'PASS' : 'FAIL';
echo "Bill Total Check (425): {$costCheck}\n";

echo "\nPHASE3_COMPLETE=true\n";
