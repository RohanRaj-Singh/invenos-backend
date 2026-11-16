<?php

namespace Tests\Feature\Composition;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Composition\Services\CompositionService;
use App\Domains\Products\Services\ProductUnitService;
use App\Models\CompositionRun;
use App\Models\CompositionRunItem;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Policies\Lifecycle\ProductPolicy;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class P1VerificationTest extends TestCase
{
    use RefreshDatabase;

    private function product(string $name = 'Product', string $unit = 'piece'): Product
    {
        return Product::create([
            'name' => $name.' '.uniqid(),
            'sku' => 'P1V-'.uniqid(),
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
        );
    }

    public function test_three_product_cycle_is_rejected(): void
    {
        $service = app(CompositionService::class);
        $a = $this->product('A', 'ml');
        $b = $this->product('B', 'ml');
        $c = $this->product('C', 'ml');

        $service->save($this->data($a, $b));
        $service->save($this->data($b, $c));

        $this->expectException(ValidationException::class);

        $service->save($this->data($c, $a));
    }

    public function test_cycle_across_composition_kinds_is_rejected(): void
    {
        $service = app(CompositionService::class);
        $a = $this->product('A', 'ml');
        $b = $this->product('B', 'ml');

        $service->save($this->data($a, $b, 1, ProductComposition::KIND_ASSEMBLY));

        $this->expectException(ValidationException::class);

        $service->save($this->data($b, $a, 1, ProductComposition::KIND_CONSUMPTION));
    }

    public function test_inactive_nested_composition_edges_are_ignored(): void
    {
        $service = app(CompositionService::class);
        $a = $this->product('A', 'ml');
        $b = $this->product('B', 'ml');
        $c = $this->product('C', 'ml');

        $service->save($this->data($a, $b));
        $bComposition = $service->save($this->data($b, $c));
        $service->deactivate($bComposition->id);

        $cComposition = $service->save($this->data($c, $a));

        $this->assertSame($c->id, $cComposition->product_id);
    }

    public function test_depth_limit_is_enforced(): void
    {
        $service = app(CompositionService::class);
        $products = [];

        for ($i = 0; $i <= 21; $i++) {
            $products[] = $this->product('Chain '.$i, 'ml');
        }

        for ($i = 0; $i < 21; $i++) {
            $service->save($this->data($products[$i], $products[$i + 1], 1));
        }

        $newRoot = $this->product('New Root', 'ml');

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('nesting is too deep');

        $service->save($this->data($newRoot, $products[0], 1));
    }

    public function test_historical_version_and_run_are_preserved(): void
    {
        $service = app(CompositionService::class);
        $product = $this->product();
        $component = $this->product('Component', 'ml');

        $v1 = $service->save($this->data($product, $component, 5));

        $run = CompositionRun::create([
            'run_number' => 'RUN-'.uniqid(),
            'composition_id' => $v1->id,
            'product_id' => $product->id,
            'kind' => ProductComposition::KIND_CONSUMPTION,
            'template_version' => $v1->version,
            'template_snapshot' => ['items' => [['component_product_id' => $component->id, 'quantity' => 5]]],
            'quantity' => 1,
            'status' => CompositionRun::STATUS_COMPLETED,
        ]);

        $v2 = $service->save($this->data($product, $component, 8));

        $this->assertSame(2, $v2->version);
        $this->assertFalse($v1->fresh()->is_active);
        $this->assertSame($v1->id, $run->fresh()->composition_id);
        $this->assertSame(5.0, $v1->items()->first()->fresh()->quantity_base);
        $this->assertSame('completed', $run->fresh()->status);

        $service->deactivate($v2->id);

        $this->assertDatabaseHas('composition_runs', ['id' => $run->id, 'composition_id' => $v1->id]);
        $this->assertDatabaseHas('product_compositions', ['id' => $v1->id]);
    }

    public function test_failed_save_leaves_the_active_version_intact(): void
    {
        $service = app(CompositionService::class);
        $product = $this->product();
        $component = $this->product('Component', 'ml');

        $v1 = $service->save($this->data($product, $component, 5));

        try {
            $service->save(new SaveCompositionData(
                productId: $product->id,
                kind: ProductComposition::KIND_CONSUMPTION,
                items: [
                    new CompositionItemData(
                        componentProductId: 999999,
                        quantityBase: 1,
                    ),
                ],
            ));
            $this->fail('Invalid composition should have failed.');
        } catch (ValidationException) {
            // Expected.
        }

        $this->assertTrue($v1->fresh()->is_active);
        $this->assertSame(1, ProductComposition::where('product_id', $product->id)->count());
        $this->assertSame(1, $v1->items()->count());
    }

    public function test_component_delete_is_restricted_by_composition_history(): void
    {
        $service = app(CompositionService::class);
        $product = $this->product();
        $component = $this->product('Component', 'ml');

        $service->save($this->data($product, $component));

        $this->expectException(QueryException::class);

        $component->forceDelete();
    }

    public function test_composition_with_runs_cannot_be_deleted(): void
    {
        $service = app(CompositionService::class);
        $product = $this->product();
        $component = $this->product('Component', 'ml');
        $composition = $service->save($this->data($product, $component));

        CompositionRun::create([
            'run_number' => 'RUN-'.uniqid(),
            'composition_id' => $composition->id,
            'product_id' => $product->id,
            'kind' => ProductComposition::KIND_CONSUMPTION,
            'template_version' => 1,
            'quantity' => 1,
        ]);

        $this->expectException(QueryException::class);

        $composition->delete();
    }

    public function test_run_delete_cascades_run_items(): void
    {
        $service = app(CompositionService::class);
        $product = $this->product();
        $component = $this->product('Component', 'ml');
        $composition = $service->save($this->data($product, $component));

        $run = CompositionRun::create([
            'run_number' => 'RUN-'.uniqid(),
            'composition_id' => $composition->id,
            'product_id' => $product->id,
            'kind' => ProductComposition::KIND_CONSUMPTION,
            'template_version' => 1,
            'quantity' => 1,
        ]);

        $run->items()->create([
            'component_product_id' => $component->id,
            'unit' => 'ml',
            'template_quantity' => 1,
            'actual_quantity' => 1,
        ]);

        $run->delete();

        $this->assertSame(0, CompositionRunItem::count());
    }

    public function test_permanent_product_delete_is_blocked_by_composition_usage(): void
    {
        $service = app(CompositionService::class);
        $product = $this->product();
        $component = $this->product('Component', 'ml');

        $service->save($this->data($product, $component));

        $this->expectException(\RuntimeException::class);

        app(ProductPolicy::class)->canPermanentDelete($component);
    }

    public function test_archived_component_remains_visible_in_composition_history(): void
    {
        $service = app(CompositionService::class);
        $product = $this->product();
        $component = $this->product('Component', 'ml');

        $composition = $service->save($this->data($product, $component));

        $component->archived_at = now();
        $component->save();

        $loaded = ProductComposition::with('items.component')->findOrFail($composition->id);

        $this->assertNotNull($loaded->items->first()->component);
        $this->assertSame($component->id, $loaded->items->first()->component->id);
    }

    public function test_unit_conversion_reuses_existing_factors(): void
    {
        $units = app(ProductUnitService::class);

        $this->assertSame(1.0, $units->convert(1000, 'g', 'kg'));
        $this->assertSame(1000.0, $units->convert(1, 'kg', 'g'));
        $this->assertSame(125.0, $units->convert(0.125, 'g', 'mg'));
        $this->assertSame(1000.0, $units->convert(1, 'KG', 'G'));
        $this->assertSame(0.001, $units->convert(1, 'ml', 'liter'));
        $this->assertNull($units->convert(1, 'kg', 'ml'));
        $this->assertNull($units->convert(1, 'furlong', 'kg'));
    }
}
