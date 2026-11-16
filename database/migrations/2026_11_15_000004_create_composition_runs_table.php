<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('composition_runs', function (Blueprint $table) {
            $table->id();
            $table->string('run_number', 50)->unique();
            $table->foreignId('composition_id')->constrained('product_compositions')->restrictOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->enum('kind', ['assembly', 'consumption']);
            $table->string('source_type', 50)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->unsignedInteger('template_version');
            $table->json('template_snapshot')->nullable();
            $table->decimal('quantity', 14, 6);
            $table->decimal('output_quantity', 14, 6)->nullable();
            $table->decimal('total_cost', 14, 6)->nullable();
            $table->decimal('unit_cost', 14, 6)->nullable();
            $table->enum('status', ['pending', 'completed', 'reversed'])->default('pending');
            $table->timestamp('effects_applied_at')->nullable();
            $table->string('created_by', 255)->nullable();
            $table->timestamps();

            $table->index(['source_type', 'source_id']);
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('composition_runs');
    }
};
