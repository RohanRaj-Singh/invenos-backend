<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_bills', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_ref', 50)->unique();
            $table->foreignId('supplier_id')->constrained('contacts');
            $table->string('supplier_name', 255);
            $table->date('date');
            $table->decimal('subtotal', 12)->default(0);
            $table->decimal('total_amount', 12)->default(0);
            $table->decimal('amount_paid', 12)->default(0);
            $table->decimal('outstanding_balance', 12)->default(0);
            $table->enum('payment_status', ['paid', 'partial', 'unpaid'])->default('unpaid');
            $table->enum('status', ['received', 'pending'])->default('received');
            $table->text('notes')->nullable();
            $table->string('created_by', 255);
            $table->timestamps();

            $table->index('supplier_id');
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_bills');
    }
};
