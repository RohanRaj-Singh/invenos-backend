<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The return writers and report queries already use these values, but the
        // enum could not store them. Extending the enum makes returns possible.
        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->enum('type', [
                'purchase', 'sale', 'return', 'sale-return', 'purchase-return',
                'adjustment', 'damage', 'consumption',
            ])->change();
        });
    }

    public function down(): void
    {
        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->enum('type', [
                'purchase', 'sale', 'return', 'adjustment', 'damage', 'consumption',
            ])->change();
        });
    }
};
