<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Quantity held at cut-over with no reliable cost. It is never
            // blended into average_cost; valuation discloses it separately.
            $table->decimal('uncosted_qty', 14, 4)->default(0)->after('average_cost');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('uncosted_qty');
        });
    }
};
