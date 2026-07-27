<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained();
            $table->string('product_name', 255)->nullable();
            $table->bigInteger('selling_unit_id')->nullable();
            $table->string('packaging_name', 100)->nullable();
            $table->decimal('packaging_quantity', 12, 4);
            $table->decimal('base_unit_quantity', 12, 4);
            $table->decimal('base_quantity', 12, 4);
            $table->decimal('unit_price', 12);
            $table->decimal('total', 12);
            $table->decimal('discount_pct', 5, 2)->default(0);
            $table->string('category', 100)->default('');
            $table->boolean('restock')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};
