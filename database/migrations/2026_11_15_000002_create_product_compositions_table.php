<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_compositions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->enum('kind', ['assembly', 'consumption']);
            $table->unsignedInteger('version')->default(1);
            $table->string('name', 255)->nullable();
            $table->decimal('output_quantity', 14, 6)->default(1);
            $table->string('output_unit_id', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->string('created_by', 255)->nullable();
            $table->timestamps();

            $table->unique(['product_id', 'kind', 'version']);
            $table->index(['product_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_compositions');
    }
};
