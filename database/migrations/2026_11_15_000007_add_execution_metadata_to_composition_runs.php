<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('composition_runs', function (Blueprint $table) {
            $table->string('idempotency_key', 100)->nullable()->unique()->after('run_number');
            $table->string('output_unit_id', 50)->nullable()->after('kind');
            $table->string('reference', 100)->nullable()->after('source_id');
            $table->string('location', 100)->nullable()->after('created_by');
            $table->string('cost_basis', 20)->nullable()->after('unit_cost');
        });
    }

    public function down(): void
    {
        Schema::table('composition_runs', function (Blueprint $table) {
            $table->dropUnique(['idempotency_key']);
            $table->dropColumn([
                'idempotency_key',
                'output_unit_id',
                'reference',
                'location',
                'cost_basis',
            ]);
        });
    }
};
