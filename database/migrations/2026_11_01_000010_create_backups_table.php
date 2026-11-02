<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('backups', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('filename');
            $table->string('disk', 50)->default('backups');
            $table->string('path');
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->string('sha256', 64)->nullable();
            $table->string('status', 20)->default('pending')->index();
            $table->unsignedSmallInteger('format_version')->default(1);
            $table->string('app_version', 50)->nullable();
            $table->unsignedInteger('schema_version')->nullable();
            $table->boolean('encrypted')->default(false);
            $table->boolean('password_protected')->default(false);
            $table->string('kind', 20)->default('manual')->index();
            $table->json('included_scope')->nullable();
            $table->json('table_counts')->nullable();
            $table->unsignedInteger('pending_jobs')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backups');
    }
};
