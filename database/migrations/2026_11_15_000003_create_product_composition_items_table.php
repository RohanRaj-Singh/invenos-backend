<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_composition_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('composition_id')->constrained('product_compositions')->cascadeOnDelete();
            $table->foreignId('component_product_id')->constrained('products')->restrictOnDelete();
            $table->decimal('quantity_base', 14, 6);
            $table->string('display_unit_id', 50)->nullable();
            $table->decimal('wastage_pct', 6, 3)->default(0);
            $table->boolean('is_optional')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['composition_id', 'component_product_id'], 'pci_composition_component_unique');
            $table->index('component_product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_composition_items');
    }
};
