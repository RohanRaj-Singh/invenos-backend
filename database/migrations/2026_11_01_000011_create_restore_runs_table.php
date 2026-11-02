<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restore_runs', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('backup_id')->nullable()->constrained('backups')->nullOnDelete();
            $table->string('source', 20)->default('upload');
            $table->string('status', 20)->default('validating')->index();
            $table->string('artifact_path')->nullable();
            $table->string('artifact_name')->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->boolean('password_protected')->default(false);
            $table->json('preview')->nullable();
            $table->foreignId('safety_backup_id')->nullable()->constrained('backups')->nullOnDelete();
            $table->string('confirmation_phrase')->nullable();
            $table->foreignId('started_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restore_runs');
    }
};
