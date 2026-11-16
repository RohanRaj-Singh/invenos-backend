<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->boolean('cost_complete')->default(true)->after('cost_price');
            $table->decimal('uncosted_quantity', 14, 6)->default(0)->after('cost_complete');
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn(['cost_complete', 'uncosted_quantity']);
        });
    }
};
