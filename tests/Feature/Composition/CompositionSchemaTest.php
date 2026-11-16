<?php

namespace Tests\Feature\Composition;

use App\Models\CompositionRun;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\ProductCompositionItem;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CompositionSchemaTest extends TestCase
{
    use RefreshDatabase;

    private function product(string $name = 'Product', string $unit = 'piece'): Product
    {
        return Product::create([
            'name' => $name.' '.uniqid(),
            'sku' => 'CMP-'.uniqid(),
            'base_unit_id' => $unit,
            'track_inventory' => true,
            'stock_quantity' => 100,
            'status' => 'in-stock',
        ]);
    }

    private function composition(Product $product): ProductComposition
    {
        return ProductComposition::create([
            'product_id' => $product->id,
            'kind' => ProductComposition::KIND_CONSUMPTION,
            'version' => 1,
            'output_quantity' => 1,
            'is_active' => true,
        ]);
    }

    public function test_composition_tables_and_columns_exist(): void
    {
        foreach ([
            'product_compositions',
            'product_composition_items',
            'composition_runs',
            'composition_run_items',
        ] as $table) {
            $this->assertTrue(Schema::hasTable($table), "Missing {$table}");
        }

        $this->assertTrue(Schema::hasColumns('product_compositions', [
            'product_id', 'kind', 'version', 'output_quantity', 'output_unit_id', 'is_active',
        ]));

        $this->assertTrue(Schema::hasColumns('product_composition_items', [
            'composition_id', 'component_product_id', 'quantity_base', 'display_unit_id',
            'wastage_pct', 'is_optional', 'sort_order',
        ]));

        $this->assertTrue(Schema::hasColumns('composition_runs', [
            'run_number', 'composition_id', 'product_id', 'kind', 'template_version',
            'template_snapshot', 'quantity', 'status',
        ]));

        $this->assertTrue(Schema::hasColumns('composition_run_items', [
            'composition_run_id', 'component_product_id', 'unit', 'template_quantity',
            'actual_quantity', 'inventory_transaction_id',
        ]));
    }

    public function test_existing_products_can_gain_compositions_without_data_loss(): void
    {
        $product = $this->product('Existing Product');
        $component = $this->product('Existing Component', 'ml');
        $originalStock = $product->stock_quantity;
        $originalName = $product->name;

        $composition = $this->composition($product);
        $composition->items()->create([
            'component_product_id' => $component->id,
            'quantity_base' => 5,
            'display_unit_id' => 'ml',
        ]);

        $product->refresh();

        $this->assertSame($originalName, $product->name);
        $this->assertSame((float) $originalStock, (float) $product->stock_quantity);
        $this->assertDatabaseHas('product_composition_items', [
            'composition_id' => $composition->id,
            'component_product_id' => $component->id,
        ]);
    }

    public function test_composition_schema_is_single_tenant_on_this_branch(): void
    {
        foreach ([
            'product_compositions',
            'product_composition_items',
            'composition_runs',
            'composition_run_items',
        ] as $table) {
            $this->assertFalse(Schema::hasColumn($table, 'company_id'));
            $this->assertFalse(Schema::hasColumn($table, 'organization_id'));
        }
    }

    public function test_a_component_can_only_appear_once_per_composition(): void
    {
        $product = $this->product();
        $component = $this->product('Component', 'ml');
        $composition = $this->composition($product);

        $composition->items()->create([
            'component_product_id' => $component->id,
            'quantity_base' => 1,
        ]);

        $this->expectException(QueryException::class);

        $composition->items()->create([
            'component_product_id' => $component->id,
            'quantity_base' => 2,
        ]);
    }

    public function test_component_foreign_key_rejects_unknown_products(): void
    {
        $product = $this->product();
        $composition = $this->composition($product);

        $this->expectException(QueryException::class);

        ProductCompositionItem::create([
            'composition_id' => $composition->id,
            'component_product_id' => 999999,
            'quantity_base' => 1,
        ]);
    }

    public function test_fractional_quantity_precision_round_trips(): void
    {
        $product = $this->product();
        $component = $this->product('Powder', 'g');
        $composition = $this->composition($product);

        $item = $composition->items()->create([
            'component_product_id' => $component->id,
            'quantity_base' => 0.125,
        ]);

        $this->assertSame(0.125, $item->fresh()->quantity_base);
    }

    public function test_run_tables_can_record_an_immutable_snapshot(): void
    {
        $product = $this->product();
        $component = $this->product('Component', 'ml');
        $composition = $this->composition($product);

        $run = CompositionRun::create([
            'run_number' => 'RUN-'.uniqid(),
            'composition_id' => $composition->id,
            'product_id' => $product->id,
            'kind' => ProductComposition::KIND_CONSUMPTION,
            'source_type' => 'sale',
            'source_id' => 1,
            'template_version' => 1,
            'template_snapshot' => ['items' => [['component_product_id' => $component->id, 'quantity' => 5]]],
            'quantity' => 1,
            'status' => CompositionRun::STATUS_PENDING,
        ]);

        $item = $run->items()->create([
            'component_product_id' => $component->id,
            'unit' => 'ml',
            'template_quantity' => 5,
            'actual_quantity' => 5,
        ]);

        $this->assertSame($composition->id, $run->composition->id);
        $this->assertSame($product->id, $run->product->id);
        $this->assertSame($component->id, $item->component->id);
        $this->assertSame(5.0, $item->fresh()->actual_quantity);
        $this->assertSame('sale', $run->fresh()->source_type);
        $snapshot = $run->fresh()->template_snapshot;
        $this->assertSame($component->id, $snapshot['items'][0]['component_product_id']);
        $this->assertSame(5, $snapshot['items'][0]['quantity']);
    }
}
