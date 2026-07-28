<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('contacts')->cascadeOnDelete();
            $table->text('notes')->nullable();
            $table->boolean('refillable')->default(false);
            $table->string('prescribed_by', 255)->nullable();
            $table->date('date');
            $table->timestamps();

            $table->index('consultation_id');
            $table->index('patient_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescriptions');
    }
};
