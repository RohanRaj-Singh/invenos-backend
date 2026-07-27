<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('selling_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('unit_id', 50);
            $table->decimal('quantity', 12, 4);
            $table->decimal('sale_price', 12);
            $table->string('barcode', 100)->nullable();
            $table->string('sku', 100)->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('selling_units');
    }
};
