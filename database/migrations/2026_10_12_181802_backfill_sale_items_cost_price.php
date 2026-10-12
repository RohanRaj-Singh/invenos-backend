<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Fix: cost_price was stored as total line COGS (costPrice * baseQty)
        // but the report multiplies by base_quantity again, squaring the quantity.
        // Backfill: divide by base_quantity to get per-unit cost.
        DB::table('sale_items')
            ->whereNotNull('cost_price')
            ->where('cost_price', '>', 0)
            ->where('base_quantity', '>', 0)
            ->update([
                'cost_price' => DB::raw('cost_price / base_quantity'),
            ]);
    }

    public function down(): void
    {
        // Reverse: multiply by base_quantity to restore total COGS
        DB::table('sale_items')
            ->whereNotNull('cost_price')
            ->where('cost_price', '>', 0)
            ->where('base_quantity', '>', 0)
            ->update([
                'cost_price' => DB::raw('cost_price * base_quantity'),
            ]);
    }
};