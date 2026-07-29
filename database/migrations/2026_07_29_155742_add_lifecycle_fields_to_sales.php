<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->softDeletes()->after('updated_at');
            $table->string('delete_reason', 500)->nullable()->after('deleted_at');
            $table->unsignedBigInteger('deleted_by')->nullable()->after('delete_reason');
        });

        Schema::table('purchase_bills', function (Blueprint $table) {
            $table->softDeletes()->after('updated_at');
            $table->string('delete_reason', 500)->nullable()->after('deleted_at');
            $table->unsignedBigInteger('deleted_by')->nullable()->after('delete_reason');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn(['delete_reason', 'deleted_by']);
        });

        Schema::table('purchase_bills', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn(['delete_reason', 'deleted_by']);
        });
    }
};
