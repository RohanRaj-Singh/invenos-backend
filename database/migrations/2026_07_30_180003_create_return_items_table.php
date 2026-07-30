<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('return_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('return_id')->constrained('returns')->cascadeOnDelete();

            // Polymorphic reference to the original line item
            $table->string('reference_item_type', 100);   // 'sale_item' or 'purchase_bill_item'
            $table->unsignedBigInteger('reference_item_id');

            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('product_name', 255)->nullable();
            $table->foreignId('selling_unit_id')->nullable()->constrained('selling_units')->nullOnDelete();
            $table->string('packaging_name', 100)->nullable();
            $table->decimal('quantity', 12, 3);
            $table->decimal('base_quantity', 12, 3);
            $table->decimal('unit_price', 12);
            $table->decimal('total', 12);
            $table->foreignId('reason_id')->nullable()->constrained('return_reasons')->nullOnDelete();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index('return_id');
            $table->index(['reference_item_type', 'reference_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('return_items');
    }
};
