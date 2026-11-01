<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Business-declared cost per base unit for stock that already existed.
            $table->decimal('opening_cost', 14, 6)->nullable()->after('default_purchase_cost');
            // Weighted average cost per base unit (post cut-over).
            $table->decimal('average_cost', 14, 6)->nullable()->after('opening_cost');
        });

        Schema::table('purchase_bill_items', function (Blueprint $table) {
            // True cost per inventory (base) unit, derived from the pack price.
            $table->decimal('unit_cost_base', 14, 6)->nullable()->after('unit_cost');
        });

        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->decimal('unit_cost', 14, 6)->nullable()->after('quantity');
            $table->date('document_date')->nullable()->after('date');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->dropColumn(['unit_cost', 'document_date']);
        });

        Schema::table('purchase_bill_items', function (Blueprint $table) {
            $table->dropColumn('unit_cost_base');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['opening_cost', 'average_cost']);
        });
    }
};
