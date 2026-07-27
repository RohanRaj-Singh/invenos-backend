<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 100)->unique()->after('name');
            $table->string('phone', 50)->default('')->after('remember_token');
            $table->enum('role', ['admin', 'salesman'])->default('salesman')->after('phone');
            $table->boolean('active')->default(true)->after('role');
            $table->timestamp('last_login')->nullable()->after('active');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['username', 'phone', 'role', 'active', 'last_login']);
            $table->dropSoftDeletes();
        });
    }
};
