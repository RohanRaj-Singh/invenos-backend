<?php

namespace Tests\Feature\Composition;

use App\Domains\Inventory\Services\InventoryService;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CompositionPrecisionTest extends TestCase
{
    use RefreshDatabase;

    public function test_inventory_quantity_columns_support_six_decimal_places(): void
    {
        $columns = [
            ['products', 'stock_quantity'],
            ['products', 'low_stock_threshold'],
            ['products', 'uncosted_qty'],
            ['inventory_transactions', 'quantity'],
            ['inventory_transactions', 'running_balance'],
        ];

        foreach ($columns as [$table, $column]) {
            $definition = DB::selectOne(
                'SELECT NUMERIC_PRECISION, NUMERIC_SCALE
                 FROM information_schema.columns
                 WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?',
                [$table, $column],
            );

            $this->assertNotNull($definition, "Missing column {$table}.{$column}");
            $this->assertSame(14, (int) $definition->NUMERIC_PRECISION, "{$table}.{$column} precision");
            $this->assertSame(6, (int) $definition->NUMERIC_SCALE, "{$table}.{$column} scale");
        }
    }

    public function test_inventory_round_trip_preserves_fractional_values(): void
    {
        $product = Product::create([
            'name' => 'Precision product',
            'sku' => 'PREC-'.uniqid(),
            'base_unit_id' => 'ml',
            'track_inventory' => true,
            'stock_quantity' => 1.125,
            'status' => 'in-stock',
        ]);

        $this->assertSame(1.125, (float) $product->fresh()->stock_quantity);

        app(InventoryService::class)->recordAdjustment(
            productId: $product->id,
            quantity: -0.125,
            type: 'adjustment',
        );

        $this->assertSame(1.0, (float) $product->fresh()->stock_quantity);
        $this->assertSame(-0.125, (float) DB::table('inventory_transactions')->first()->quantity);
        $this->assertSame(1.0, (float) DB::table('inventory_transactions')->first()->running_balance);
    }
}
