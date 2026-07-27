<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_bill_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_bill_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained();
            $table->string('product_name', 255)->nullable();
            $table->string('base_unit_id', 50)->nullable();
            $table->string('base_unit_name', 50)->nullable();
            $table->string('purchase_pack_name', 100)->nullable();
            $table->decimal('purchase_pack_qty', 12, 4);
            $table->decimal('purchase_quantity', 12, 4);
            $table->decimal('unit_cost', 12);
            $table->decimal('total_cost', 12);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_bill_items');
    }
};
