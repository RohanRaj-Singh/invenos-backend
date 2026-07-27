<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['purchase', 'sale', 'return', 'adjustment', 'damage', 'consumption']);
            $table->decimal('quantity', 12, 2)->comment('Signed: + for inflow, - for outflow');
            $table->string('unit', 50);
            $table->string('packaging_name', 100)->nullable();
            $table->decimal('packaging_quantity', 12, 4)->nullable();
            $table->date('date');
            $table->string('reference', 100);
            $table->text('notes')->nullable();
            $table->string('user', 255)->nullable();
            $table->decimal('running_balance', 12, 2);
            $table->timestamps();

            $table->index('product_id');
            $table->index('type');
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
    }
};
