<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_packaging', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('container_unit_id')->constrained('product_units');
            $table->foreignId('contains_unit_id')->constrained('product_units');
            $table->decimal('quantity', 12, 4);
            $table->unsignedTinyInteger('level');
            $table->timestamps();

            $table->index('product_id');
            $table->unique(['product_id', 'container_unit_id', 'contains_unit_id'], 'packaging_unique_pair');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_packaging');
    }
};
