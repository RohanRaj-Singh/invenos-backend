<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('returns', function (Blueprint $table) {
            // Prevents double-completion; a return applies effects exactly once.
            $table->timestamp('effects_applied_at')->nullable()->after('status');
            // Links a reversal document back to the return it compensates.
            $table->unsignedBigInteger('reversal_of_id')->nullable()->after('effects_applied_at');
        });

        Schema::table('return_items', function (Blueprint $table) {
            // Restocking is decided per line, not per document.
            $table->boolean('restock')->default(true)->after('total');
        });

        Schema::table('returns', function (Blueprint $table) {
            $table->enum('status', ['pending', 'completed', 'cancelled', 'reversed'])->change();
        });
    }

    public function down(): void
    {
        Schema::table('returns', function (Blueprint $table) {
            $table->enum('status', ['pending', 'completed', 'cancelled'])->change();
            $table->dropColumn(['effects_applied_at', 'reversal_of_id']);
        });

        Schema::table('return_items', function (Blueprint $table) {
            $table->dropColumn('restock');
        });
    }
};
