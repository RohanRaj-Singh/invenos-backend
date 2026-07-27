<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 50)->unique();
            $table->enum('source', ['pos', 'clinic', 'manual'])->default('pos');
            $table->date('date');
            $table->foreignId('customer_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->string('customer_name', 255)->nullable();
            $table->decimal('subtotal', 12)->default(0);
            $table->decimal('discount', 12)->default(0);
            $table->decimal('grand_total', 12)->default(0);
            $table->decimal('amount_paid', 12)->default(0);
            $table->decimal('outstanding_balance', 12)->default(0);
            $table->enum('payment_status', ['paid', 'partial', 'unpaid'])->default('unpaid');
            $table->text('notes')->nullable();
            $table->string('created_by', 255);
            $table->timestamps();

            $table->index('customer_id');
            $table->index('date');
            $table->index('payment_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
