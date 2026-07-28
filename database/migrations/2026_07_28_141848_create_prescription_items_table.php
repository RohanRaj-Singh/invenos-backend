<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescription_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained()->cascadeOnDelete();
            // Links to the sale's line item — product, selling unit, quantity, price live there.
            $table->foreignId('sale_item_id')->constrained('sale_items')->cascadeOnDelete();
            // Clinical fields ONLY:
            $table->string('dosage', 100)->default('1');
            $table->string('frequency', 100)->default('Once daily');
            $table->string('duration', 100)->default('7 days');
            $table->text('instructions')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('prescription_id');
            $table->index('sale_item_id');
            $table->unique('sale_item_id', 'rx_item_sale_item_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescription_items');
    }
};
