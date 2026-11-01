<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('financial_transactions', function (Blueprint $table) {
            // Walk-in sales and expenses have no contact.
            $table->unsignedBigInteger('contact_id')->nullable()->change();

            $table->string('source_type', 30)->nullable()->after('type');
            $table->unsignedBigInteger('source_id')->nullable()->after('source_type');

            // One key per business event; prevents duplicate posting.
            $table->string('event_key', 100)->nullable()->unique()->after('reference');

            $table->foreignId('linked_purchase_id')
                ->nullable()
                ->after('linked_sale_id')
                ->constrained('purchase_bills')
                ->nullOnDelete();

            $table->foreignId('linked_return_id')
                ->nullable()
                ->after('linked_purchase_id')
                ->constrained('returns')
                ->nullOnDelete();

            // Reversals are compensating rows; the original is never deleted.
            $table->unsignedBigInteger('reversal_of_id')->nullable()->after('linked_return_id');
            $table->timestamp('reversed_at')->nullable()->after('reversal_of_id');

            $table->index(['source_type', 'source_id'], 'ft_source_index');
            $table->index(['contact_id', 'date'], 'ft_contact_date_index');
        });
    }

    public function down(): void
    {
        Schema::table('financial_transactions', function (Blueprint $table) {
            $table->dropIndex('ft_source_index');
            $table->dropIndex('ft_contact_date_index');
            $table->dropForeign(['linked_purchase_id']);
            $table->dropForeign(['linked_return_id']);
            $table->dropColumn([
                'source_type', 'source_id', 'event_key',
                'linked_purchase_id', 'linked_return_id',
                'reversal_of_id', 'reversed_at',
            ]);
            $table->unsignedBigInteger('contact_id')->nullable(false)->change();
        });
    }
};
