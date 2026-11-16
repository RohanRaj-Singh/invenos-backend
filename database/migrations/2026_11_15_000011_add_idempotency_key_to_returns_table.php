<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('returns', function (Blueprint $table) {
            $table->string('idempotency_key', 100)
                ->nullable()
                ->after('return_number');

            $table->unique('idempotency_key', 'returns_idempotency_key_unique');
        });
    }

    public function down(): void
    {
        Schema::table('returns', function (Blueprint $table) {
            $table->dropUnique('returns_idempotency_key_unique');
            $table->dropColumn('idempotency_key');
        });
    }
};
