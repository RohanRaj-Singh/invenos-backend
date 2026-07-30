<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('return_total', 12)->default(0)->after('outstanding_balance');
            $table->enum('return_status', ['none', 'partial', 'full'])->default('none')->after('return_total');
        });

        Schema::table('purchase_bills', function (Blueprint $table) {
            $table->decimal('return_total', 12)->default(0)->after('outstanding_balance');
            $table->enum('return_status', ['none', 'partial', 'full'])->default('none')->after('return_total');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['return_total', 'return_status']);
        });

        Schema::table('purchase_bills', function (Blueprint $table) {
            $table->dropColumn(['return_total', 'return_status']);
        });
    }
};
