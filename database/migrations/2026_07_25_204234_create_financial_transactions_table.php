<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('financial_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->constrained();
            $table->enum('direction', ['in', 'out']);
            $table->enum('type', ['invoice', 'collection', 'advance', 'refund', 'adjustment', 'payout']);
            $table->date('date');
            $table->decimal('amount', 12);
            $table->enum('method', ['cash', 'card', 'transfer', 'easypaisa', 'jazzcash'])->default('cash');
            $table->string('reference', 100);
            $table->text('description')->nullable();
            $table->foreignId('linked_sale_id')->nullable()->constrained('sales');
            $table->string('created_by', 255);
            $table->timestamps();

            $table->index('contact_id');
            $table->index('type');
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('financial_transactions');
    }
};
