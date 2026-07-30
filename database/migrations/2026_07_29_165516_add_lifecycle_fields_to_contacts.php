<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable()->after('deleted_at');
            $table->string('archive_reason', 500)->nullable()->after('archived_at');
            $table->unsignedBigInteger('archived_by')->nullable()->after('archive_reason');
            $table->string('delete_reason', 500)->nullable()->after('archived_by');
            $table->unsignedBigInteger('deleted_by')->nullable()->after('delete_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropColumn(['archived_at', 'archive_reason', 'archived_by', 'delete_reason', 'deleted_by']);
        });
    }
};
