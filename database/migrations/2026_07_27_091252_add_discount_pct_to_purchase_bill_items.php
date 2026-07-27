<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table("purchase_bill_items", function (Blueprint $table) {
            $table->decimal("discount_pct", 5, 2)->nullable()->after("unit_cost");
        });
    }

    public function down(): void
    {
        Schema::table("purchase_bill_items", function (Blueprint $table) {
            $table->dropColumn("discount_pct");
        });
    }
};
