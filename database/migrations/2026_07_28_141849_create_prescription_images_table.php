<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescription_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained()->cascadeOnDelete();
            $table->string('image_path', 255);
            $table->string('original_name', 255)->nullable();
            $table->string('mime_type', 50)->nullable();
            $table->unsignedInteger('size')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index('prescription_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescription_images');
    }
};
