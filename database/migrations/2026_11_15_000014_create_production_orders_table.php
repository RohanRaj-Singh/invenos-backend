<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('production_orders', function (Blueprint $table) {
            $table->id();
            $table->string('production_number', 50)->unique();

            $table->foreignId('product_id')
                ->constrained('products')
                ->restrictOnDelete();

            $table->foreignId('composition_id')
                ->constrained('product_compositions')
                ->restrictOnDelete();

            $table->unsignedInteger('composition_version');
            $table->decimal('planned_quantity', 14, 6);
            $table->string('output_unit_id', 50);
            $table->decimal('actual_output_quantity', 14, 6)->nullable();
            $table->decimal('actual_output_base_quantity', 14, 6)->nullable();
            $table->string('location', 100)->nullable();
            $table->string('status', 20)->default('draft');

            $table->date('planned_date')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('reversed_at')->nullable();

            $table->foreignId('composition_run_id')
                ->nullable()
                ->unique('production_orders_composition_run_unique')
                ->constrained('composition_runs')
                ->restrictOnDelete();

            $table->decimal('total_cost', 14, 6)->nullable();
            $table->decimal('unit_cost', 14, 6)->nullable();
            $table->string('cost_basis', 20)->nullable();
            $table->boolean('cost_complete')->default(false);

            $table->foreignId('finished_inventory_transaction_id')
                ->nullable()
                ->constrained('inventory_transactions')
                ->restrictOnDelete();

            $table->foreignId('reversal_inventory_transaction_id')
                ->nullable()
                ->constrained('inventory_transactions')
                ->restrictOnDelete();

            $table->string('idempotency_key', 100)->nullable()->unique();
            $table->string('reversal_idempotency_key', 100)->nullable()->unique();

            $table->string('created_by', 255)->nullable();
            $table->string('completed_by', 255)->nullable();
            $table->string('reversed_by', 255)->nullable();
            $table->string('reference', 100)->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index('status');
            $table->index('product_id');
            $table->index('planned_date');
            $table->index('completed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_orders');
    }
};
