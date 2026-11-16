<?php

namespace Tests\Feature\Composition;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Composition\Services\CompositionService;
use App\Models\Product;
use App\Models\ProductComposition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class CompositionValidationTest extends TestCase
{
    use RefreshDatabase;

    private function product(string $name = 'Product', string $unit = 'piece', bool $trackInventory = true): Product
    {
        return Product::create([
            'name' => $name.' '.uniqid(),
            'sku' => 'VAL-'.uniqid(),
            'base_unit_id' => $unit,
            'track_inventory' => $trackInventory,
            'stock_quantity' => 100,
            'status' => 'in-stock',
        ]);
    }

    private function item(Product $component, float $quantity = 5, array $overrides = []): CompositionItemData
    {
        return new CompositionItemData(
            componentProductId: $overrides['component_product_id'] ?? $component->id,
            quantityBase: $overrides['quantity_base'] ?? $quantity,
            displayUnitId: $overrides['display_unit_id'] ?? $component->base_unit_id,
            wastagePct: $overrides['wastage_pct'] ?? 0,
            isOptional: $overrides['is_optional'] ?? false,
            sortOrder: $overrides['sort_order'] ?? null,
        );
    }

    private function data(Product $product, array $items, array $overrides = []): SaveCompositionData
    {
        return new SaveCompositionData(
            productId: $overrides['product_id'] ?? $product->id,
            kind: $overrides['kind'] ?? ProductComposition::KIND_CONSUMPTION,
            items: $items,
            name: 'Validation formula',
            outputQuantity: $overrides['output_quantity'] ?? 1,
            outputUnitId: $overrides['output_unit_id'] ?? $product->base_unit_id,
        );
    }

    private function expectValidation(callable $callback, ?string $field = null): void
    {
        try {
            $callback();
            $this->fail('Expected a validation exception.');
        } catch (ValidationException $e) {
            if ($field !== null) {
                $this->assertArrayHasKey($field, $e->errors());
            }
        }
    }

    public function test_unknown_component_is_rejected(): void
    {
        $product = $this->product();

        $this->expectValidation(
            fn () => app(CompositionService::class)->save($this->data($product, [
                $this->item($product, 1, ['component_product_id' => 999999]),
            ])),
            'items.0.component_product_id',
        );
    }

    public function test_product_cannot_contain_itself(): void
    {
        $product = $this->product();

        $this->expectValidation(
            fn () => app(CompositionService::class)->save($this->data($product, [$this->item($product)])),
            'items',
        );
    }

    public function test_duplicate_components_are_rejected(): void
    {
        $product = $this->product();
        $component = $this->product('Component', 'ml');

        $this->expectValidation(
            fn () => app(CompositionService::class)->save($this->data($product, [
                $this->item($component),
                $this->item($component),
            ])),
            'items',
        );
    }

    public function test_component_quantity_must_be_positive(): void
    {
        $product = $this->product();
        $component = $this->product('Component', 'ml');

        $this->expectValidation(
            fn () => app(CompositionService::class)->save($this->data($product, [
                $this->item($component, 0),
            ])),
            'items.0.quantity_base',
        );
    }

    public function test_incompatible_display_unit_is_rejected(): void
    {
        $product = $this->product('Product', 'piece');
        $component = $this->product('Component', 'piece');

        $this->expectValidation(
            fn () => app(CompositionService::class)->save($this->data($product, [
                $this->item($component, 1, ['display_unit_id' => 'kg']),
            ])),
            'items.0.display_unit_id',
        );
    }

    public function test_unknown_display_unit_is_rejected(): void
    {
        $product = $this->product();
        $component = $this->product('Component', 'piece');

        $this->expectValidation(
            fn () => app(CompositionService::class)->save($this->data($product, [
                $this->item($component, 1, ['display_unit_id' => 'furlong']),
            ])),
            'items.0.display_unit_id',
        );
    }

    public function test_archived_component_is_rejected(): void
    {
        $product = $this->product();
        $component = $this->product('Component', 'ml');
        $component->archived_at = now();
        $component->save();

        $this->expectValidation(
            fn () => app(CompositionService::class)->save($this->data($product, [$this->item($component)])),
            'items.0.component_product_id',
        );
    }

    public function test_soft_deleted_component_is_rejected(): void
    {
        $product = $this->product();
        $component = $this->product('Component', 'ml');
        $component->delete();

        $this->expectValidation(
            fn () => app(CompositionService::class)->save($this->data($product, [$this->item($component)])),
            'items.0.component_product_id',
        );
    }

    public function test_non_inventory_component_is_rejected(): void
    {
        $product = $this->product();
        $component = $this->product('Service', 'piece', false);

        $this->expectValidation(
            fn () => app(CompositionService::class)->save($this->data($product, [$this->item($component)])),
            'items.0.component_product_id',
        );
    }

    public function test_cycle_is_rejected(): void
    {
        $service = app(CompositionService::class);
        $a = $this->product('A', 'ml');
        $b = $this->product('B', 'ml');

        $service->save($this->data($a, [$this->item($b)]));

        $this->expectValidation(
            fn () => $service->save($this->data($b, [$this->item($a)])),
            'items',
        );
    }

    public function test_nested_composition_is_allowed_when_acyclic(): void
    {
        $service = app(CompositionService::class);
        $a = $this->product('A', 'ml');
        $b = $this->product('B', 'ml');
        $c = $this->product('C', 'ml');

        $service->save($this->data($a, [$this->item($b)]));
        $composition = $service->save($this->data($c, [$this->item($a)]));

        $this->assertSame($c->id, $composition->product_id);
        $this->assertSame($a->id, $composition->items()->first()->component_product_id);
    }

    public function test_empty_composition_is_rejected(): void
    {
        $product = $this->product();

        $this->expectValidation(
            fn () => app(CompositionService::class)->save($this->data($product, [])),
            'items',
        );
    }

    public function test_output_quantity_must_be_positive(): void
    {
        $product = $this->product();
        $component = $this->product('Component', 'ml');

        $this->expectValidation(
            fn () => app(CompositionService::class)->save($this->data($product, [
                $this->item($component),
            ], ['output_quantity' => 0])),
            'output_quantity',
        );
    }

    public function test_output_unit_must_be_compatible(): void
    {
        $product = $this->product('Product', 'piece');
        $component = $this->product('Component', 'piece');

        $this->expectValidation(
            fn () => app(CompositionService::class)->save($this->data($product, [
                $this->item($component),
            ], ['output_unit_id' => 'kg'])),
            'output_unit_id',
        );
    }

    public function test_wastage_must_be_within_range(): void
    {
        $product = $this->product();
        $component = $this->product('Component', 'ml');

        $this->expectValidation(
            fn () => app(CompositionService::class)->save($this->data($product, [
                $this->item($component, 5, ['wastage_pct' => 101]),
            ])),
            'items.0.wastage_pct',
        );
    }

    public function test_archived_parent_product_is_rejected(): void
    {
        $product = $this->product();
        $component = $this->product('Component', 'ml');
        $product->archived_at = now();
        $product->save();

        $this->expectValidation(
            fn () => app(CompositionService::class)->save($this->data($product, [$this->item($component)])),
            'product_id',
        );
    }
}
