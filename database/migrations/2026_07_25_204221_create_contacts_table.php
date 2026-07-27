<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['person', 'organization'])->default('person');
            $table->json('roles');
            $table->string('name', 255);
            $table->string('company_name', 255)->nullable();
            $table->string('contact_person', 255)->nullable();
            $table->string('phone', 50);
            $table->string('email', 255)->nullable();
            $table->string('cnic', 20)->nullable();
            $table->text('address')->nullable();
            $table->decimal('opening_balance', 12)->default(0);
            $table->enum('balance_type', ['receivable', 'payable'])->default('receivable');
            $table->decimal('current_balance', 12)->default(0);
            $table->text('notes')->nullable();
            $table->string('created_by', 255)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('name');
            $table->index('phone');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contacts');
    }
};
