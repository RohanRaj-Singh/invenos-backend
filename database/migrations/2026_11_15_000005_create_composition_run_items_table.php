<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('composition_run_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('composition_run_id')->constrained('composition_runs')->cascadeOnDelete();
            $table->foreignId('component_product_id')->constrained('products')->restrictOnDelete();
            $table->string('unit', 50);
            $table->decimal('template_quantity', 14, 6);
            $table->decimal('actual_quantity', 14, 6);
            $table->decimal('unit_cost', 14, 6)->nullable();
            $table->decimal('total_cost', 14, 6)->nullable();
            $table->foreignId('inventory_transaction_id')->nullable()->constrained('inventory_transactions')->restrictOnDelete();
            $table->timestamps();

            $table->unique(['composition_run_id', 'component_product_id'], 'cri_run_component_unique');
            $table->index('component_product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('composition_run_items');
    }
};
