<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('returns', function (Blueprint $table) {
            $table->id();
            $table->string('return_number', 50)->unique();
            $table->enum('type', ['SALE', 'PURCHASE']);

            // Polymorphic reference to the original document
            $table->string('reference_type', 100);   // 'sale' or 'purchase_bill'
            $table->unsignedBigInteger('reference_id');

            $table->foreignId('contact_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->date('return_date');
            $table->foreignId('reason_id')->nullable()->constrained('return_reasons')->nullOnDelete();
            $table->text('reason_note')->nullable();
            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('pending');

            // Financial
            $table->decimal('subtotal', 12)->default(0);
            $table->decimal('discount', 12)->default(0);
            $table->decimal('grand_total', 12)->default(0);
            $table->decimal('refund_amount', 12)->default(0);
            $table->string('refund_method', 50)->nullable();

            $table->text('notes')->nullable();
            $table->string('created_by', 255)->nullable();

            // Lifecycle fields
            $table->string('delete_reason', 500)->nullable();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();

            $table->timestamps();

            $table->index(['reference_type', 'reference_id']);
            $table->index('return_date');
            $table->index('status');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('returns');
    }
};
