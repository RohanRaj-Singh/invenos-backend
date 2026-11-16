<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('composition_run_items', function (Blueprint $table) {
            $table->string('component_name', 255)->nullable()->after('component_product_id');
            $table->string('component_sku', 100)->nullable()->after('component_name');
            $table->string('display_unit_id', 50)->nullable()->after('unit');
            $table->decimal('display_quantity', 14, 6)->nullable()->after('display_unit_id');
            $table->decimal('wastage_pct', 6, 3)->default(0)->after('actual_quantity');
            $table->boolean('is_optional')->default(false)->after('wastage_pct');
            $table->string('cost_basis', 20)->nullable()->after('total_cost');
            $table->json('source_breakdown')->nullable()->after('cost_basis');
        });
    }

    public function down(): void
    {
        Schema::table('composition_run_items', function (Blueprint $table) {
            $table->dropColumn([
                'component_name',
                'component_sku',
                'display_unit_id',
                'display_quantity',
                'wastage_pct',
                'is_optional',
                'cost_basis',
                'source_breakdown',
            ]);
        });
    }
};
