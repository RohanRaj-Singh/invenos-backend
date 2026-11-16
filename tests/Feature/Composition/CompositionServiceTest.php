<?php

namespace Tests\Feature\Composition;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Composition\Services\CompositionService;
use App\Models\CompositionRun;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\User;
use App\Policies\Lifecycle\ProductPolicy;
use App\Services\Lifecycle\RecordLifecycleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class CompositionServiceTest extends TestCase
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

    private function data(Product $product, Product $component, float $quantity = 5, string $kind = ProductComposition::KIND_CONSUMPTION): SaveCompositionData
    {
        return new SaveCompositionData(
            productId: $product->id,
            kind: $kind,
            items: [
                new CompositionItemData(
                    componentProductId: $component->id,
                    quantityBase: $quantity,
                    displayUnitId: $component->base_unit_id,
                ),
            ],
            name: 'Test formula',
            outputQuantity: 1,
            outputUnitId: $product->base_unit_id,
        );
    }

    public function test_valid_composition_creation_and_versioning(): void
    {
        $product = $this->product();
        $component = $this->product('Component', 'ml');
        $service = app(CompositionService::class);

        $v1 = $service->save($this->data($product, $component, 5), 'tester');
        $this->assertSame(1, $v1->version);
        $this->assertTrue($v1->is_active);
        $this->assertSame($product->base_unit_id, $v1->output_unit_id);
        $this->assertCount(1, $v1->items);

        $v2 = $service->save($this->data($product, $component, 6), 'tester');

        $this->assertSame(2, $v2->version);
        $this->assertTrue($v2->is_active);
        $this->assertFalse($v1->fresh()->is_active);
        $this->assertSame(5.0, $v1->items()->first()->fresh()->quantity_base);
        $this->assertSame(6.0, $v2->items()->first()->fresh()->quantity_base);

        $active = $service->getActive($product->id, ProductComposition::KIND_CONSUMPTION);
        $this->assertSame($v2->id, $active->id);
    }

    public function test_update_creates_a_new_version_without_mutating_the_old_template(): void
    {
        $product = $this->product();
        $first = $this->product('First', 'ml');
        $second = $this->product('Second', 'ml');
        $service = app(CompositionService::class);

        $v1 = $service->save($this->data($product, $first, 5));
        $v2 = $service->update($v1, $this->data($product, $second, 2));

        $this->assertSame(2, $v2->version);
        $this->assertFalse($v1->fresh()->is_active);
        $this->assertSame($first->id, $v1->items()->first()->component_product_id);
        $this->assertSame($second->id, $v2->items()->first()->component_product_id);
    }

    public function test_update_rejects_changing_the_product_or_kind(): void
    {
        $product = $this->product();
        $other = $this->product('Other');
        $component = $this->product('Component', 'ml');
        $service = app(CompositionService::class);

        $composition = $service->save($this->data($product, $component, 5));

        $this->expectException(ValidationException::class);

        $service->update($composition, $this->data($other, $component, 5));
    }

    public function test_deactivation_does_not_change_stock_or_create_runs(): void
    {
        $product = $this->product();
        $component = $this->product('Component', 'ml');
        $service = app(CompositionService::class);

        $composition = $service->save($this->data($product, $component, 5));

        $stockBefore = (float) $product->fresh()->stock_quantity;
        $movementsBefore = InventoryTransaction::count();

        $service->deactivate($composition->id);

        $this->assertFalse($composition->fresh()->is_active);
        $this->assertSame($stockBefore, (float) $product->fresh()->stock_quantity);
        $this->assertSame($movementsBefore, InventoryTransaction::count());
        $this->assertSame(0, CompositionRun::count());
    }

    public function test_saving_and_updating_a_composition_never_moves_inventory(): void
    {
        $product = $this->product();
        $component = $this->product('Component', 'ml');
        $service = app(CompositionService::class);

        $stockBefore = (float) $component->fresh()->stock_quantity;
        $movementsBefore = InventoryTransaction::count();

        $v1 = $service->save($this->data($product, $component, 5));
        $service->save($this->data($product, $component, 8));
        $service->deactivate($v1->id);

        $this->assertSame($stockBefore, (float) $component->fresh()->stock_quantity);
        $this->assertSame($movementsBefore, InventoryTransaction::count());
        $this->assertSame(0, CompositionRun::count());
        $this->assertSame(0, InventoryTransaction::where('type', 'consumption')->count());
    }

    public function test_a_product_used_in_a_composition_cannot_be_deleted(): void
    {
        $product = $this->product();
        $component = $this->product('Component', 'ml');
        $service = app(CompositionService::class);

        $service->save($this->data($product, $component, 5));

        $blocker = app(ProductPolicy::class)->deleteBlocker($component);

        $this->assertNotNull($blocker);
        $this->assertSame(1, $blocker['compositions']);

        $this->expectException(\Throwable::class);

        app(RecordLifecycleService::class)->delete(
            $component,
            'test',
            User::factory()->create(['role' => 'admin']),
        );
    }

    public function test_get_for_product_returns_only_active_definitions(): void
    {
        $product = $this->product();
        $component = $this->product('Component', 'ml');
        $other = $this->product('Other Component', 'ml');
        $service = app(CompositionService::class);

        $consumption = $service->save($this->data($product, $component, 5));
        $assembly = $service->save($this->data($product, $other, 2, ProductComposition::KIND_ASSEMBLY));

        $active = $service->getForProduct($product->id);

        $this->assertCount(2, $active);
        $this->assertTrue($active->contains('id', $consumption->id));
        $this->assertTrue($active->contains('id', $assembly->id));

        $service->deactivate($consumption->id);

        $this->assertCount(1, $service->getForProduct($product->id));
    }
}
