<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('selling_units', function (Blueprint $table) {
            // Link to the packaging level that generated this selling unit.
            // Null = standalone/custom selling unit. Never cascades — customized
            // units must not be silently deleted when packaging is removed.
            $table->foreignId('packaging_id')
                ->nullable()
                ->constrained('product_packaging')
                ->nullOnDelete();

            $table->index('packaging_id');

            // Link to the canonical unit name registry.
            // The derivation engine uses this for matching instead of string names,
            // eliminating case-sensitivity, pluralization, and localization issues.
            $table->foreignId('product_unit_id')
                ->nullable()
                ->constrained('product_units')
                ->nullOnDelete();

            $table->index('product_unit_id');
        });
    }

    public function down(): void
    {
        Schema::table('selling_units', function (Blueprint $table) {
            $table->dropForeign(['packaging_id']);
            $table->dropIndex(['packaging_id']);
            $table->dropColumn('packaging_id');

            $table->dropForeign(['product_unit_id']);
            $table->dropIndex(['product_unit_id']);
            $table->dropColumn('product_unit_id');
        });
    }
};
