<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->enum('type', [
                'purchase', 'sale', 'return', 'sale-return', 'purchase-return',
                'adjustment', 'damage', 'consumption', 'production',
            ])->change();
        });
    }

    public function down(): void
    {
        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->enum('type', [
                'purchase', 'sale', 'return', 'sale-return', 'purchase-return',
                'adjustment', 'damage', 'consumption',
            ])->change();
        });
    }
};
