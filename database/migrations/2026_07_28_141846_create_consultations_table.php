<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('contacts')->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('visit_date');
            $table->string('type', 100)->default('General Consultation');
            $table->text('diagnosis')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('consultation_fee', 12)->default(0);
            $table->enum('status', ['completed', 'scheduled', 'follow-up'])->default('completed');
            $table->foreignId('sale_id')->nullable()->constrained('sales')->nullOnDelete();
            $table->string('created_by', 255)->nullable();
            $table->timestamps();

            $table->index('patient_id');
            $table->index('visit_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultations');
    }
};
