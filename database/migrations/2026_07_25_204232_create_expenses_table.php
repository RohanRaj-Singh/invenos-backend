<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('expense_number', 50)->unique();
            $table->date('date');
            $table->foreignId('category_id')->constrained('expense_categories');
            $table->decimal('amount', 12);
            $table->string('paid_to', 255)->default('');
            $table->enum('payment_method', ['cash', 'card', 'transfer', 'easypaisa', 'jazzcash'])->default('cash');
            $table->text('notes')->nullable();
            $table->string('created_by', 255);
            $table->timestamps();

            $table->index('category_id');
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
