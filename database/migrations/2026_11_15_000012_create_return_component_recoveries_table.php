<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Material recovery ledger for composition returns.
     *
     * A commercial return and a material restoration are deliberately separate
     * facts: this table records what was physically recovered from a returned
     * composition sale line, against the immutable run-item snapshot that
     * consumed it. The commercial refund lives on `returns` / `return_items`.
     */
    public function up(): void
    {
        Schema::create('return_component_recoveries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('return_id')
                ->constrained('returns')
                ->cascadeOnDelete();

            $table->foreignId('return_item_id')
                ->constrained('return_items')
                ->cascadeOnDelete();

            $table->foreignId('composition_run_id')
                ->constrained('composition_runs')
                ->restrictOnDelete();

            $table->foreignId('composition_run_item_id')
                ->constrained('composition_run_items')
                ->restrictOnDelete();

            $table->foreignId('component_product_id')
                ->constrained('products')
                ->restrictOnDelete();

            // Snapshot of the consumed component identity at request time.
            $table->string('component_name', 255)->nullable();
            $table->string('unit', 50);

            // Recoverable basis = min(template_quantity, actual_quantity) of the
            // run item, i.e. consumed material excluding wastage.
            $table->decimal('basis_quantity', 14, 6);

            // Cap for this return line, proportional to the returned commercial
            // quantity and net of previously restored material.
            $table->decimal('eligible_quantity', 14, 6);

            // Verified quantity actually restored to inventory.
            $table->decimal('recovered_quantity', 14, 6);

            // Cost snapshot copied from the immutable run item (never re-resolved).
            $table->decimal('unit_cost', 14, 6)->nullable();
            $table->decimal('total_cost', 14, 6)->nullable();

            $table->foreignId('inventory_transaction_id')
                ->nullable()
                ->constrained('inventory_transactions')
                ->restrictOnDelete();

            $table->timestamp('restored_at')->nullable();
            $table->string('created_by', 255)->nullable();

            $table->timestamps();

            // One recovery row per consumed component line per return line.
            // Re-declaring the same recovery for the same return is rejected by
            // the database, not only by application logic.
            $table->unique(
                ['return_item_id', 'composition_run_item_id'],
                'rcr_item_run_item_unique'
            );

            $table->index('return_id');
            $table->index('composition_run_id');
            $table->index('component_product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('return_component_recoveries');
    }
};
