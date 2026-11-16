<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('stock_quantity', 14, 6)->default(0)->change();
            $table->decimal('low_stock_threshold', 14, 6)->default(10)->change();
            $table->decimal('uncosted_qty', 14, 6)->default(0)->change();
        });

        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->decimal('quantity', 14, 6)->change();
            $table->decimal('running_balance', 14, 6)->change();
        });
    }

    public function down(): void
    {
        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->decimal('quantity', 12, 2)->change();
            $table->decimal('running_balance', 12, 2)->change();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->decimal('stock_quantity', 12, 2)->default(0)->change();
            $table->decimal('low_stock_threshold', 12, 2)->default(10)->change();
            $table->decimal('uncosted_qty', 14, 4)->default(0)->change();
        });
    }
};
