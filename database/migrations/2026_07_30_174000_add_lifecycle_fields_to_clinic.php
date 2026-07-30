<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ─── consultations ────────────────────────────────────────────
        Schema::table('consultations', function (Blueprint $table) {
            $table->softDeletes();
            $table->string('delete_reason', 500)->nullable()->after('status');
            $table->foreignId('deleted_by')->nullable()
                ->after('delete_reason')->constrained('users')->nullOnDelete();
        });

        // ─── prescriptions ────────────────────────────────────────────
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->softDeletes();
            $table->string('delete_reason', 500)->nullable();
            $table->foreignId('deleted_by')->nullable()
                ->constrained('users')->nullOnDelete();
        });

        // ─── prescription_items ───────────────────────────────────────
        Schema::table('prescription_items', function (Blueprint $table) {
            $table->softDeletes();
        });

        // ─── prescription_images ──────────────────────────────────────
        Schema::table('prescription_images', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->dropForeign(['deleted_by']);
            $table->dropColumn(['deleted_at', 'delete_reason', 'deleted_by']);
        });

        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropForeign(['deleted_by']);
            $table->dropColumn(['deleted_at', 'delete_reason', 'deleted_by']);
        });

        Schema::table('prescription_items', function (Blueprint $table) {
            $table->dropColumn('deleted_at');
        });

        Schema::table('prescription_images', function (Blueprint $table) {
            $table->dropColumn('deleted_at');
        });
    }
};