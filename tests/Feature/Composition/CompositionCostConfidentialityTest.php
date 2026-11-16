<?php

namespace Tests\Feature\Composition;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Composition\Services\CompositionService;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * P15 Phase 2: composition cost is financial data. Users without
 * `products.composition.cost` must not receive it from ANY composition
 * response — not merely have it hidden by the UI.
 */
class CompositionCostConfidentialityTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role = 'admin', bool $active = true): User
    {
        return User::factory()->create(['role' => $role, 'active' => $active]);
    }

    private function product(string $name = 'Product', string $unit = 'g', ?float $cost = 2.5): Product
    {
        return Product::create([
            'name' => $name.' '.uniqid(),
            'sku' => 'COST-'.uniqid(),
            'base_unit_id' => $unit,
            'track_inventory' => true,
            'stock_quantity' => 100,
            'average_cost' => $cost,
            'status' => 'in-stock',
        ]);
    }

    private function makeComposition(Product $parent, Product $component): ProductComposition
    {
        return app(CompositionService::class)->save(new SaveCompositionData(
            productId: $parent->id,
            kind: ProductComposition::KIND_CONSUMPTION,
            items: [new CompositionItemData(
                componentProductId: $component->id,
                quantityBase: 10,
                displayUnitId: $component->base_unit_id,
            )],
            name: 'Probe formula',
            outputQuantity: 1,
            outputUnitId: $parent->base_unit_id,
        ), 'tester');
    }

    private function previewPayload(Product $parent, Product $component): array
    {
        return [
            'kind' => ProductComposition::KIND_CONSUMPTION,
            'output_quantity' => 1,
            'output_unit_id' => $parent->base_unit_id,
            'items' => [[
                'component_product_id' => $component->id,
                'quantity' => 10,
                'unit_id' => $component->base_unit_id,
            ]],
        ];
    }

    private const COMPOSITION_COST_KEYS = [
        'data.estimated_cost',
        'data.estimated_unit_cost',
        'data.cost_basis',
        'data.cost_complete',
        'data.is_estimated',
    ];

    private const ITEM_COST_KEYS = [
        'data.items.0.unit_cost',
        'data.items.0.line_cost',
        'data.items.0.cost_basis',
    ];

    public function test_authorized_user_receives_cost_on_active_composition(): void
    {
        $admin = $this->user('admin');
        $parent = $this->product('Parent');
        $component = $this->product('Ingredient');
        $this->makeComposition($parent, $component);

        $response = $this->actingAs($admin)
            ->getJson("/inventory/product/{$parent->id}/composition?kind=consumption")
            ->assertOk();

        // 10g x 2.5 = 25
        $response->assertJsonPath('data.estimated_cost', 25)
            ->assertJsonPath('data.items.0.unit_cost', 2.5)
            ->assertJsonPath('data.items.0.line_cost', 25);
    }

    public function test_unauthorized_user_receives_no_cost_on_active_composition(): void
    {
        $admin = $this->user('admin');
        $salesman = $this->user('salesman');
        $parent = $this->product('Parent');
        $component = $this->product('Ingredient');
        $this->makeComposition($parent, $component);

        $this->actingAs($admin)->getJson("/inventory/product/{$parent->id}/composition?kind=consumption")->assertOk();

        $response = $this->actingAs($salesman)
            ->getJson("/inventory/product/{$parent->id}/composition?kind=consumption")
            ->assertOk();

        foreach ([...self::COMPOSITION_COST_KEYS, ...self::ITEM_COST_KEYS] as $path) {
            $response->assertJsonMissingPath($path);
        }

        // Structure must survive: viewing a formula is still allowed.
        $response->assertJsonPath('data.version', 1)
            ->assertJsonPath('data.items.0.quantity_base', 10)
            ->assertJsonPath('data.items.0.component.name', $component->name);
    }

    public function test_unauthorized_user_receives_no_cost_in_version_history(): void
    {
        $admin = $this->user('admin');
        $salesman = $this->user('salesman');
        $parent = $this->product('Parent');
        $component = $this->product('Ingredient');
        $this->makeComposition($parent, $component);

        $response = $this->actingAs($salesman)
            ->getJson("/inventory/product/{$parent->id}/compositions")
            ->assertOk();

        foreach (['data.0.estimated_cost', 'data.0.cost_basis', 'data.0.items.0.unit_cost'] as $path) {
            $response->assertJsonMissingPath($path);
        }

        $response->assertJsonPath('data.0.version', 1);
    }

    public function test_unauthorized_user_receives_no_cost_on_single_version(): void
    {
        $admin = $this->user('admin');
        $salesman = $this->user('salesman');
        $parent = $this->product('Parent');
        $component = $this->product('Ingredient');
        $composition = $this->makeComposition($parent, $component);

        $this->actingAs($salesman)
            ->getJson("/inventory/product/{$parent->id}/composition/{$composition->id}")
            ->assertOk()
            ->assertJsonMissingPath('data.estimated_cost')
            ->assertJsonMissingPath('data.items.0.line_cost');
    }

    public function test_cost_preview_endpoint_is_protected(): void
    {
        $salesman = $this->user('salesman');
        $parent = $this->product('Parent');
        $component = $this->product('Ingredient');

        $this->actingAs($salesman)
            ->postJson("/inventory/product/{$parent->id}/composition/preview", $this->previewPayload($parent, $component))
            ->assertForbidden();
    }

    public function test_nested_ingredient_cost_does_not_leak(): void
    {
        $salesman = $this->user('salesman');
        $parent = $this->product('Parent');
        $component = $this->product('Ingredient');
        $this->makeComposition($parent, $component);

        $response = $this->actingAs($salesman)
            ->getJson("/inventory/product/{$parent->id}/composition?kind=consumption")
            ->assertOk();

        // Nothing anywhere in the payload should carry a cost-looking key.
        $json = json_encode($response->json());
        $this->assertStringNotContainsString('estimated_cost', $json);
        $this->assertStringNotContainsString('unit_cost', $json);
        $this->assertStringNotContainsString('line_cost', $json);
    }

    public function test_product_page_cost_flag_is_server_decided(): void
    {
        $admin = $this->user('admin');
        $salesman = $this->user('salesman');
        $product = $this->product('Page Product');

        $this->actingAs($admin)->get("/inventory/product/{$product->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('can_view_cost', true));

        $this->actingAs($salesman)->get("/inventory/product/{$product->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('can_view_cost', false));
    }

    public function test_inactive_user_sees_no_cost(): void
    {
        $inactive = $this->user('admin', false);
        $parent = $this->product('Parent');
        $component = $this->product('Ingredient');
        $this->makeComposition($parent, $component);

        $this->actingAs($inactive)
            ->getJson("/inventory/product/{$parent->id}/composition?kind=consumption")
            ->assertForbidden();
    }
}
