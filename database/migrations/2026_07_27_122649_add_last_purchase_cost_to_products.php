<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('last_purchase_cost', 12, 2)->nullable()->after('status');
            $table->decimal('default_purchase_cost', 12, 2)->nullable()->after('last_purchase_cost');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['last_purchase_cost', 'default_purchase_cost']);
        });
    }
};
