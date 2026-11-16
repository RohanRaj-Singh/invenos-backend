<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('composition_runs', function (Blueprint $table) {
            $table->foreignId('sale_item_id')
                ->nullable()
                ->after('source_id')
                ->constrained('sale_items')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('composition_runs', function (Blueprint $table) {
            $table->dropForeign(['sale_item_id']);
            $table->dropColumn('sale_item_id');
        });
    }
};
