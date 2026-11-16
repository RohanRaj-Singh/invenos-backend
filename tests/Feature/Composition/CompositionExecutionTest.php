<?php

namespace Tests\Feature\Composition;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\CompositionItemOverrideData;
use App\Domains\Composition\DTOs\ExecuteCompositionData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Composition\Exceptions\InsufficientComponentStockException;
use App\Domains\Composition\Services\CompositionExecutionService;
use App\Domains\Composition\Services\CompositionService;
use App\Models\CompositionRun;
use App\Models\CompositionRunItem;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\ProductCompositionItem;
use App\Models\SaleItem;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class CompositionExecutionTest extends TestCase
{
    use RefreshDatabase;

    private function product(
        string $name = 'Product',
        string $unit = 'piece',
        float $stock = 100,
        bool $track = true,
        bool $allowNegativeStock = false,
    ): Product {
        return Product::create([
            'name' => $name.' '.uniqid(),
            'sku' => 'EXE-'.uniqid(),
            'base_unit_id' => $unit,
            'track_inventory' => $track,
            'stock_quantity' => $stock,
            'status' => $stock > 0 ? 'in-stock' : 'out-of-stock',
            // Stock protection is what this suite exercises, so the policy is
            // stated explicitly instead of inherited from the model default.
            'allow_negative_stock' => $allowNegativeStock,
            'location' => 'Main store',
        ]);
    }

    private function item(Product $component, float $quantity, float $wastage = 0, bool $optional = false): CompositionItemData
    {
        return new CompositionItemData(
            componentProductId: $component->id,
            quantityBase: $quantity,
            displayUnitId: $component->base_unit_id,
            wastagePct: $wastage,
            isOptional: $optional,
        );
    }

    /**
     * @param  CompositionItemData[]  $items
     */
    private function composition(
        Product $product,
        array $items,
        string $kind = ProductComposition::KIND_CONSUMPTION,
        float $outputQuantity = 1,
        ?string $outputUnitId = null,
    ): ProductComposition {
        return app(CompositionService::class)->save(new SaveCompositionData(
            productId: $product->id,
            kind: $kind,
            items: $items,
            name: 'Execution formula',
            outputQuantity: $outputQuantity,
            outputUnitId: $outputUnitId ?: $product->base_unit_id,
        ), 'tester');
    }

    private function execute(
        ProductComposition $composition,
        float $quantity = 1,
        ?string $quantityUnitId = null,
        array $optionalItemIds = [],
        array $overrides = [],
        ?string $idempotencyKey = null,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?string $reference = null,
        ?string $location = null,
    ): CompositionRun {
        return app(CompositionExecutionService::class)->execute(new ExecuteCompositionData(
            compositionId: $composition->id,
            quantity: $quantity,
            quantityUnitId: $quantityUnitId,
            sourceType: $sourceType,
            sourceId: $sourceId,
            reference: $reference,
            idempotencyKey: $idempotencyKey,
            createdBy: 'tester',
            location: $location,
            optionalItemIds: $optionalItemIds,
            overrides: $overrides,
        ));
    }

    public function test_execution_consumes_components_and_records_an_immutable_run(): void
    {
        $product = $this->product('Service', 'piece');
        $first = $this->product('First component', 'ml');
        $second = $this->product('Second component', 'piece');
        $composition = $this->composition($product, [
            $this->item($first, 5),
            $this->item($second, 2),
        ]);

        $run = $this->execute($composition);

        $this->assertSame(CompositionRun::STATUS_COMPLETED, $run->status);
        $this->assertSame($composition->id, $run->composition_id);
        $this->assertSame($product->id, $run->product_id);
        $this->assertSame(ProductComposition::KIND_CONSUMPTION, $run->kind);
        $this->assertSame(1, $run->template_version);
        $this->assertSame('manual', $run->source_type);
        $this->assertSame('Main store', $run->location);
        $this->assertNotNull($run->effects_applied_at);
        $this->assertCount(2, $run->items);

        $this->assertSame(95.0, (float) $first->fresh()->stock_quantity);
        $this->assertSame(98.0, (float) $second->fresh()->stock_quantity);
        $this->assertSame(100.0, (float) $product->fresh()->stock_quantity);

        $this->assertSame(2, InventoryTransaction::where('type', 'consumption')->count());
        $this->assertSame(2, InventoryTransaction::where('reference_id', $run->id)->count());
        $this->assertSame(0, SaleItem::count());

        $firstItem = $run->items->firstWhere('component_product_id', $first->id);
        $this->assertStringStartsWith('First component', $firstItem->component_name);
        $this->assertSame(5.0, $firstItem->actual_quantity);
        $this->assertSame('ml', $firstItem->unit);
        $this->assertNotNull($firstItem->inventory_transaction_id);
        $this->assertIsArray($firstItem->source_breakdown);
        $this->assertSame($composition->id, $firstItem->source_breakdown[0]['composition_id']);
    }

    public function test_execution_scales_every_component_by_requested_quantity(): void
    {
        $product = $this->product('Service', 'piece');
        $component = $this->product('Component', 'ml');
        $composition = $this->composition($product, [$this->item($component, 5)]);

        $this->execute($composition, 5);

        $this->assertSame(75.0, (float) $component->fresh()->stock_quantity);
        $this->assertSame(25.0, (float) CompositionRunItem::first()->actual_quantity);
        $this->assertSame(25.0, (float) CompositionRunItem::first()->template_quantity);
    }

    public function test_output_unit_conversion_scales_the_template_correctly(): void
    {
        $product = $this->product('Service', 'g', 1000);
        $component = $this->product('Component', 'g', 1000);
        $composition = $this->composition($product, [$this->item($component, 500)], outputQuantity: 1, outputUnitId: 'kg');

        $this->execute($composition, 0.5, 'kg');

        $this->assertSame(750.0, (float) $component->fresh()->stock_quantity);
        $this->assertSame(250.0, (float) CompositionRunItem::first()->actual_quantity);
    }

    public function test_wastage_is_applied_to_the_scaled_quantity(): void
    {
        $product = $this->product('Service', 'piece');
        $component = $this->product('Component', 'ml');
        $composition = $this->composition($product, [$this->item($component, 10, 10)]);

        $this->execute($composition, 2);

        $this->assertSame(78.0, (float) $component->fresh()->stock_quantity);
        $this->assertSame(22.0, (float) CompositionRunItem::first()->actual_quantity);
        $this->assertSame(20.0, (float) CompositionRunItem::first()->template_quantity);
        $this->assertSame(10.0, (float) CompositionRunItem::first()->wastage_pct);
        $this->assertSame(10.0, (float) CompositionRunItem::first()->source_breakdown[0]['wastage_pct']);
    }

    public function test_override_records_absolute_actual_consumption_without_changing_the_template(): void
    {
        $product = $this->product('Service', 'piece');
        $component = $this->product('Component', 'ml');
        $composition = $this->composition($product, [$this->item($component, 5)]);
        $itemId = $composition->items()->first()->id;

        $run = $this->execute(
            $composition,
            2,
            overrides: [new CompositionItemOverrideData($itemId, 3, 'ml')],
        );

        $this->assertSame(97.0, (float) $component->fresh()->stock_quantity);
        $this->assertSame(3.0, (float) $run->items->first()->actual_quantity);
        $this->assertSame(10.0, (float) $run->items->first()->template_quantity);
        $this->assertTrue($run->items->first()->source_breakdown[0]['overridden']);
        $this->assertSame(5.0, (float) $composition->items()->first()->fresh()->quantity_base);
    }

    public function test_optional_components_are_omitted_unless_explicitly_selected(): void
    {
        $product = $this->product('Service', 'piece');
        $mandatory = $this->product('Mandatory', 'ml');
        $optional = $this->product('Optional', 'ml');
        $composition = $this->composition($product, [
            $this->item($mandatory, 5),
            $this->item($optional, 2, optional: true),
        ]);
        $optionalItemId = $composition->items()->where('is_optional', true)->first()->id;

        $first = $this->execute($composition);
        $this->assertCount(1, $first->items);
        $this->assertSame(100.0, (float) $optional->fresh()->stock_quantity);

        $second = $this->execute($composition, optionalItemIds: [$optionalItemId]);
        $this->assertCount(2, $second->items);
        $this->assertSame(98.0, (float) $optional->fresh()->stock_quantity);
        $this->assertSame(90.0, (float) $mandatory->fresh()->stock_quantity);
    }

    public function test_optional_selection_and_overrides_are_validated_server_side(): void
    {
        $product = $this->product('Service', 'piece');
        $component = $this->product('Component', 'ml');
        $composition = $this->composition($product, [$this->item($component, 5)]);
        $mandatoryItemId = $composition->items()->first()->id;

        try {
            $this->execute($composition, optionalItemIds: [999999]);
            $this->fail('Unknown optional item should have been rejected.');
        } catch (ValidationException) {
            $this->assertSame(100.0, (float) $component->fresh()->stock_quantity);
        }

        $this->expectException(ValidationException::class);
        $this->execute($composition, optionalItemIds: [$mandatoryItemId]);
    }

    public function test_override_for_an_omitted_optional_component_is_rejected(): void
    {
        $product = $this->product('Service', 'piece');
        $mandatory = $this->product('Mandatory', 'ml');
        $optional = $this->product('Optional', 'ml');
        $composition = $this->composition($product, [
            $this->item($mandatory, 5),
            $this->item($optional, 2, optional: true),
        ]);
        $optionalItemId = $composition->items()->where('is_optional', true)->first()->id;

        $this->expectException(ValidationException::class);

        $this->execute(
            $composition,
            overrides: [new CompositionItemOverrideData($optionalItemId, 1, 'ml')],
        );
    }

    public function test_unknown_or_non_positive_override_is_rejected_without_moving_stock(): void
    {
        $product = $this->product('Service', 'piece');
        $component = $this->product('Component', 'ml');
        $composition = $this->composition($product, [$this->item($component, 5)]);

        try {
            $this->execute($composition, overrides: [new CompositionItemOverrideData(999999, 1, 'ml')]);
            $this->fail('Unknown override should have been rejected.');
        } catch (ValidationException) {
            $this->assertSame(100.0, (float) $component->fresh()->stock_quantity);
        }

        $this->expectException(ValidationException::class);
        $this->execute($composition, overrides: [new CompositionItemOverrideData($composition->items()->first()->id, 0, 'ml')]);
    }

    public function test_insufficient_component_rejects_the_whole_execution_atomically(): void
    {
        $product = $this->product('Service', 'piece');
        $available = $this->product('Available', 'ml');
        $scarce = $this->product('Scarce', 'ml', 1);
        $composition = $this->composition($product, [
            $this->item($available, 5),
            $this->item($scarce, 5),
        ]);

        try {
            $this->execute($composition, 2);
            $this->fail('Insufficient component stock should have rejected the run.');
        } catch (InsufficientComponentStockException $exception) {
            $this->assertSame($scarce->id, $exception->componentProductId);
            $this->assertSame(10.0, $exception->requiredQuantity);
            $this->assertSame(1.0, $exception->availableQuantity);
        }

        $this->assertSame(100.0, (float) $available->fresh()->stock_quantity);
        $this->assertSame(1.0, (float) $scarce->fresh()->stock_quantity);
        $this->assertSame(0, CompositionRun::count());
        $this->assertSame(0, CompositionRunItem::count());
        $this->assertSame(0, InventoryTransaction::where('type', 'consumption')->count());
    }

    public function test_archived_component_is_rejected_before_any_run_is_created(): void
    {
        $product = $this->product('Service', 'piece');
        $component = $this->product('Component', 'ml');
        $composition = $this->composition($product, [$this->item($component, 5)]);

        $component->archived_at = now();
        $component->save();

        $this->expectException(ValidationException::class);

        try {
            $this->execute($composition);
        } finally {
            $this->assertSame(0, CompositionRun::count());
            $this->assertSame(0, InventoryTransaction::where('type', 'consumption')->count());
        }
    }

    public function test_inactive_composition_and_assembly_execution_are_rejected(): void
    {
        $product = $this->product('Service', 'piece');
        $component = $this->product('Component', 'ml');
        $composition = $this->composition($product, [$this->item($component, 5)]);
        app(CompositionService::class)->deactivate($composition->id);

        try {
            $this->execute($composition);
            $this->fail('Inactive composition should have been rejected.');
        } catch (ValidationException) {
            $this->assertSame(0, CompositionRun::count());
        }

        $assembly = $this->composition(
            $this->product('Assembly', 'piece'),
            [$this->item($this->product('Assembly component', 'piece'), 1)],
            ProductComposition::KIND_ASSEMBLY,
        );

        $this->expectException(ValidationException::class);
        $this->execute($assembly);
    }

    public function test_nested_consumption_composition_is_exploded_to_raw_components(): void
    {
        $service = $this->product('Service', 'piece');
        $nestedService = $this->product('Nested service', 'piece');
        $raw = $this->product('Raw material', 'ml');

        $nested = $this->composition($nestedService, [$this->item($raw, 10)]);
        $parent = $this->composition($service, [$this->item($nestedService, 1)]);

        $run = $this->execute($parent, 2);

        $this->assertSame(80.0, (float) $raw->fresh()->stock_quantity);
        $this->assertSame(100.0, (float) $nestedService->fresh()->stock_quantity);
        $this->assertCount(1, $run->items);
        $this->assertSame($raw->id, $run->items->first()->component_product_id);
        $this->assertSame(20.0, (float) $run->items->first()->actual_quantity);
        $this->assertSame(1, $run->items->first()->source_breakdown[0]['depth']);
        $this->assertSame($nested->id, $run->items->first()->source_breakdown[0]['composition_id']);
    }

    public function test_nested_assembly_component_is_treated_as_stock_not_exploded(): void
    {
        $service = $this->product('Service', 'piece');
        $assemblyProduct = $this->product('Assembled product', 'piece', 10);
        $raw = $this->product('Raw material', 'ml');

        $this->composition($assemblyProduct, [$this->item($raw, 10)], ProductComposition::KIND_ASSEMBLY);
        $parent = $this->composition($service, [$this->item($assemblyProduct, 2)]);

        $run = $this->execute($parent);

        $this->assertSame(8.0, (float) $assemblyProduct->fresh()->stock_quantity);
        $this->assertSame(100.0, (float) $raw->fresh()->stock_quantity);
        $this->assertSame($assemblyProduct->id, $run->items->first()->component_product_id);
        $this->assertSame(2.0, (float) $run->items->first()->actual_quantity);
    }

    public function test_repeated_component_across_nested_paths_is_aggregated_into_one_movement(): void
    {
        $service = $this->product('Service', 'piece');
        $firstNested = $this->product('First nested service', 'piece');
        $secondNested = $this->product('Second nested service', 'piece');
        $raw = $this->product('Shared raw material', 'ml');

        $this->composition($firstNested, [$this->item($raw, 5)]);
        $this->composition($secondNested, [$this->item($raw, 7)]);
        $parent = $this->composition($service, [
            $this->item($firstNested, 1),
            $this->item($secondNested, 1),
        ]);

        $run = $this->execute($parent);

        $this->assertSame(88.0, (float) $raw->fresh()->stock_quantity);
        $this->assertCount(1, $run->items);
        $this->assertSame(12.0, (float) $run->items->first()->actual_quantity);
        $this->assertCount(2, $run->items->first()->source_breakdown);
        $this->assertSame(1, InventoryTransaction::where('type', 'consumption')->count());
    }

    public function test_execution_detects_a_cycle_defensively_even_if_a_bad_template_exists(): void
    {
        $first = $this->product('Cycle A', 'ml');
        $second = $this->product('Cycle B', 'ml');

        $firstComposition = ProductComposition::create([
            'product_id' => $first->id,
            'kind' => ProductComposition::KIND_CONSUMPTION,
            'version' => 1,
            'output_quantity' => 1,
            'output_unit_id' => 'ml',
            'is_active' => true,
        ]);
        ProductCompositionItem::create([
            'composition_id' => $firstComposition->id,
            'component_product_id' => $second->id,
            'quantity_base' => 1,
            'display_unit_id' => 'ml',
        ]);

        $secondComposition = ProductComposition::create([
            'product_id' => $second->id,
            'kind' => ProductComposition::KIND_CONSUMPTION,
            'version' => 1,
            'output_quantity' => 1,
            'output_unit_id' => 'ml',
            'is_active' => true,
        ]);
        ProductCompositionItem::create([
            'composition_id' => $secondComposition->id,
            'component_product_id' => $first->id,
            'quantity_base' => 1,
            'display_unit_id' => 'ml',
        ]);

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('cycle');

        try {
            $this->execute($firstComposition);
        } finally {
            $this->assertSame(0, CompositionRun::count());
            $this->assertSame(0, InventoryTransaction::where('type', 'consumption')->count());
        }
    }

    public function test_idempotent_retry_returns_the_original_run_without_consuming_twice(): void
    {
        $product = $this->product('Service', 'piece');
        $component = $this->product('Component', 'ml');
        $composition = $this->composition($product, [$this->item($component, 5)]);

        $first = $this->execute($composition, 2, idempotencyKey: 'execution-key-1');
        $second = $this->execute($composition, 2, idempotencyKey: 'execution-key-1');

        $this->assertSame($first->id, $second->id);
        $this->assertSame(1, CompositionRun::count());
        $this->assertSame(1, InventoryTransaction::where('type', 'consumption')->count());
        $this->assertSame(90.0, (float) $component->fresh()->stock_quantity);
    }

    public function test_a_failed_execution_does_not_reserve_the_idempotency_key(): void
    {
        $product = $this->product('Service', 'piece');
        $component = $this->product('Component', 'ml', 1);
        $composition = $this->composition($product, [$this->item($component, 5)]);

        try {
            $this->execute($composition, 2, idempotencyKey: 'retry-after-failure');
            $this->fail('The first execution should have failed on stock.');
        } catch (InsufficientComponentStockException) {
            $this->assertSame(0, CompositionRun::count());
        }

        $component->update(['stock_quantity' => 100]);

        $run = $this->execute($composition, 2, idempotencyKey: 'retry-after-failure');

        $this->assertSame('retry-after-failure', $run->idempotency_key);
        $this->assertSame(90.0, (float) $component->fresh()->stock_quantity);
        $this->assertSame(1, CompositionRun::count());
    }

    public function test_database_unique_constraint_protects_idempotency_keys(): void
    {
        $product = $this->product('Service', 'piece');
        $component = $this->product('Component', 'ml');
        $composition = $this->composition($product, [$this->item($component, 5)]);

        $this->execute($composition, idempotencyKey: 'unique-key');

        $this->expectException(QueryException::class);

        CompositionRun::create([
            'run_number' => 'RUN-'.uniqid(),
            'idempotency_key' => 'unique-key',
            'composition_id' => $composition->id,
            'product_id' => $product->id,
            'kind' => ProductComposition::KIND_CONSUMPTION,
            'template_version' => 1,
            'quantity' => 1,
        ]);
    }

    public function test_source_metadata_and_reference_are_snapshotted(): void
    {
        $product = $this->product('Service', 'piece');
        $component = $this->product('Component', 'ml');
        $composition = $this->composition($product, [$this->item($component, 5)]);

        $run = $this->execute(
            $composition,
            sourceType: 'sale',
            sourceId: 99,
            reference: 'INV-99',
            location: 'Treatment room',
        );

        $this->assertSame('sale', $run->source_type);
        $this->assertSame(99, $run->source_id);
        $this->assertSame('INV-99', $run->reference);
        $this->assertSame('Treatment room', $run->location);
        $this->assertSame('INV-99', InventoryTransaction::first()->reference);
    }

    public function test_cost_snapshot_is_taken_at_execution_time(): void
    {
        $product = $this->product('Service', 'piece');
        $component = $this->product('Component', 'ml');
        $component->update(['average_cost' => 2.5]);
        $composition = $this->composition($product, [$this->item($component, 1)]);

        $run = $this->execute($composition, 4);

        $this->assertSame(2.5, $run->items->first()->unit_cost);
        $this->assertSame(10.0, $run->items->first()->total_cost);
        $this->assertSame(10.0, $run->total_cost);
        $this->assertSame(2.5, $run->unit_cost);
        $this->assertSame('exact', $run->cost_basis);
        $this->assertSame('exact', $run->items->first()->cost_basis);

        $component->update(['average_cost' => 99]);

        $this->assertSame(2.5, $run->fresh(['items'])->items->first()->unit_cost);
        $this->assertSame(10.0, $run->fresh()->total_cost);
    }

    public function test_unavailable_cost_is_null_not_zero(): void
    {
        $product = $this->product('Service', 'piece');
        $component = $this->product('Component', 'ml');
        $composition = $this->composition($product, [$this->item($component, 5)]);

        $run = $this->execute($composition);

        $this->assertNull($run->items->first()->unit_cost);
        $this->assertNull($run->items->first()->total_cost);
        $this->assertSame('unavailable', $run->items->first()->cost_basis);
        $this->assertNull($run->total_cost);
        $this->assertNull($run->unit_cost);
        $this->assertSame('unavailable', $run->cost_basis);
    }

    public function test_run_snapshot_survives_template_changes_renames_and_archival(): void
    {
        $product = $this->product('Service', 'piece');
        $component = $this->product('Component', 'ml');
        $composition = $this->composition($product, [$this->item($component, 5)]);
        $run = $this->execute($composition);
        $originalSnapshot = $run->template_snapshot;
        $originalName = $run->items->first()->component_name;
        $originalSku = $run->items->first()->component_sku;

        app(CompositionService::class)->save(new SaveCompositionData(
            productId: $product->id,
            kind: ProductComposition::KIND_CONSUMPTION,
            items: [$this->item($component, 9)],
            name: 'Execution formula v2',
            outputQuantity: 1,
            outputUnitId: $product->base_unit_id,
        ), 'tester');

        $component->update(['name' => 'Renamed component', 'sku' => 'RENAMED-SKU']);
        $component->archived_at = now();
        $component->save();

        $fresh = $run->fresh(['items']);

        $this->assertEquals($originalSnapshot, $fresh->template_snapshot);
        $this->assertSame($originalName, $fresh->items->first()->component_name);
        $this->assertSame($originalSku, $fresh->items->first()->component_sku);
        $this->assertSame(1, $fresh->template_version);
        $this->assertSame(5.0, $fresh->items->first()->actual_quantity);
        $this->assertSame(1, $fresh->items->first()->source_breakdown[0]['composition_version']);
    }

    public function test_fractional_component_consumption_survives_the_ledger_round_trip(): void
    {
        $product = $this->product('Service', 'piece');
        $component = $this->product('Component', 'ml', 1);
        $composition = $this->composition($product, [$this->item($component, 0.125)]);

        $run = $this->execute($composition);

        $this->assertSame(0.875, (float) $component->fresh()->stock_quantity);
        $this->assertSame(0.125, (float) $run->items->first()->actual_quantity);
        $this->assertSame(-0.125, (float) InventoryTransaction::first()->quantity);
        $this->assertSame(0.875, (float) InventoryTransaction::first()->running_balance);
    }
}
