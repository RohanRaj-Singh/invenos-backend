<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('sku', 100)->unique();
            $table->string('barcode', 100)->nullable()->unique();
            $table->foreignId('category_id')->nullable()->constrained('product_categories')->nullOnDelete();
            $table->text('description')->nullable();
            $table->enum('product_type', ['simple', 'composite'])->default('simple');
            $table->string('base_unit_id', 50)->default('piece');
            $table->boolean('track_inventory')->default(true);
            $table->decimal('stock_quantity', 12, 2)->default(0);
            $table->decimal('low_stock_threshold', 12, 2)->default(10);
            $table->enum('status', ['in-stock', 'low-stock', 'out-of-stock'])->default('in-stock');
            $table->string('supplier_name', 255)->nullable();
            $table->string('location', 100)->nullable();
            $table->string('created_by', 255)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
