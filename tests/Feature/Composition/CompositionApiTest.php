<?php

namespace Tests\Feature\Composition;

use App\Models\CompositionRun;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompositionApiTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function product(string $name = 'Product', string $unit = 'piece', ?float $averageCost = 10, bool $trackInventory = true): Product
    {
        return Product::create([
            'name' => $name.' '.uniqid(),
            'sku' => 'API-'.uniqid(),
            'base_unit_id' => $unit,
            'track_inventory' => $trackInventory,
            'stock_quantity' => 100,
            'average_cost' => $averageCost,
            'status' => 'in-stock',
        ]);
    }

    private function payload(Product $parent, array $rows, string $kind = ProductComposition::KIND_CONSUMPTION): array
    {
        return [
            'kind' => $kind,
            'name' => 'API Formula',
            'output_quantity' => 1,
            'output_unit_id' => $parent->base_unit_id,
            'items' => array_map(fn (array $row) => [
                'component_product_id' => $row[0]->id,
                'quantity' => $row[1],
                'unit_id' => $row[2] ?? $row[0]->base_unit_id,
                'wastage_pct' => $row[3] ?? 0,
                'is_optional' => false,
            ], $rows),
        ];
    }

    public function test_admin_can_create_list_show_version_and_deactivate(): void
    {
        $admin = $this->admin();
        $parent = $this->product('Burger');
        $component = $this->product('Sauce', 'ml', 10);

        $created = $this->actingAs($admin)
            ->postJson("/inventory/product/{$parent->id}/composition", $this->payload($parent, [[$component, 5]]));

        $created->assertCreated()
            ->assertJsonPath('data.version', 1)
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('data.items.0.quantity_base', 5)
            ->assertJsonPath('data.items.0.component_product_id', $component->id)
            ->assertJsonPath('data.estimated_cost', 50);

        $id = $created->json('data.id');

        $this->actingAs($admin)
            ->getJson("/inventory/product/{$parent->id}/compositions")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($admin)
            ->getJson("/inventory/product/{$parent->id}/composition?kind=consumption")
            ->assertOk()
            ->assertJsonPath('data.id', $id);

        $this->actingAs($admin)
            ->getJson("/inventory/product/{$parent->id}/composition/{$id}")
            ->assertOk()
            ->assertJsonPath('data.id', $id);

        $updated = $this->actingAs($admin)
            ->putJson("/inventory/product/{$parent->id}/composition/{$id}", $this->payload($parent, [[$component, 6]]));

        $updated->assertOk()
            ->assertJsonPath('data.version', 2)
            ->assertJsonPath('data.items.0.quantity_base', 6);

        $activeId = $updated->json('data.id');

        $this->actingAs($admin)
            ->getJson("/inventory/product/{$parent->id}/compositions")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.version', 2)
            ->assertJsonPath('data.0.is_active', true)
            ->assertJsonPath('data.1.version', 1)
            ->assertJsonPath('data.1.is_active', false)
            ->assertJsonPath('data.1.items.0.quantity_base', 5);

        $this->actingAs($admin)
            ->deleteJson("/inventory/product/{$parent->id}/composition/{$activeId}")
            ->assertOk();

        $this->actingAs($admin)
            ->getJson("/inventory/product/{$parent->id}/composition?kind=consumption")
            ->assertOk()
            ->assertJsonPath('data', null);

        $this->assertSame((float) $component->stock_quantity, (float) $component->fresh()->stock_quantity);
        $this->assertSame(0, InventoryTransaction::count());
    }

    public function test_display_quantity_is_converted_to_the_component_base_unit(): void
    {
        $admin = $this->admin();
        $parent = $this->product('Cake');
        $component = $this->product('Flour', 'kg', 10);

        $response = $this->actingAs($admin)->postJson(
            "/inventory/product/{$parent->id}/composition",
            $this->payload($parent, [[$component, 250, 'g']]),
        );

        $response->assertCreated()
            ->assertJsonPath('data.items.0.quantity_base', 0.25)
            ->assertJsonPath('data.items.0.display_quantity', 250)
            ->assertJsonPath('data.items.0.display_unit_id', 'g')
            ->assertJsonPath('data.estimated_cost', 2.5);
    }

    public function test_validation_rejects_duplicates_self_reference_and_invalid_units(): void
    {
        $admin = $this->admin();
        $parent = $this->product('Pizza');
        $component = $this->product('Cheese', 'piece', 10);

        $this->actingAs($admin)
            ->postJson("/inventory/product/{$parent->id}/composition", $this->payload($parent, [
                [$component, 1],
                [$component, 2],
            ]))
            ->assertStatus(422);

        $this->actingAs($admin)
            ->postJson("/inventory/product/{$parent->id}/composition", $this->payload($parent, [
                [$parent, 1],
            ]))
            ->assertStatus(422);

        $this->actingAs($admin)
            ->postJson("/inventory/product/{$parent->id}/composition", $this->payload($parent, [
                [$component, 1, 'kg'],
            ]))
            ->assertStatus(422);
    }

    public function test_composition_must_belong_to_the_route_product(): void
    {
        $admin = $this->admin();
        $first = $this->product('First');
        $second = $this->product('Second');
        $component = $this->product('Component', 'ml', 10);

        $id = $this->actingAs($admin)
            ->postJson("/inventory/product/{$first->id}/composition", $this->payload($first, [[$component, 1]]))
            ->json('data.id');

        $this->actingAs($admin)
            ->getJson("/inventory/product/{$second->id}/composition/{$id}")
            ->assertNotFound();

        $this->actingAs($admin)
            ->putJson("/inventory/product/{$second->id}/composition/{$id}", $this->payload($second, [[$component, 1]]))
            ->assertNotFound();

        $this->actingAs($admin)
            ->deleteJson("/inventory/product/{$second->id}/composition/{$id}")
            ->assertNotFound();
    }

    public function test_preview_does_not_persist_or_move_inventory(): void
    {
        $admin = $this->admin();
        $parent = $this->product('Service');
        $component = $this->product('Serum', 'ml', 10);

        $before = [
            'compositions' => ProductComposition::count(),
            'movements' => InventoryTransaction::count(),
            'stock' => (float) $component->stock_quantity,
        ];

        $this->actingAs($admin)
            ->postJson(
                "/inventory/product/{$parent->id}/composition/preview",
                $this->payload($parent, [[$component, 5, 'ml', 10]]),
            )
            ->assertOk()
            ->assertJsonPath('data.complete', true)
            ->assertJsonPath('data.items.0.effective_quantity', 5.5)
            ->assertJsonPath('data.total_cost', 55);

        $this->assertSame($before['compositions'], ProductComposition::count());
        $this->assertSame($before['movements'], InventoryTransaction::count());
        $this->assertSame($before['stock'], (float) $component->fresh()->stock_quantity);
    }

    public function test_nested_composition_cost_preview_recurses(): void
    {
        $admin = $this->admin();
        $parent = $this->product('Meal');
        $intermediate = $this->product('Sauce', 'piece', null);
        $raw = $this->product('Tomato', 'piece', 4);

        $this->actingAs($admin)
            ->postJson("/inventory/product/{$intermediate->id}/composition", $this->payload($intermediate, [[$raw, 1]]))
            ->assertCreated();

        $response = $this->actingAs($admin)->postJson(
            "/inventory/product/{$parent->id}/composition/preview",
            $this->payload($parent, [[$intermediate, 2]]),
        );

        $response->assertOk()
            ->assertJsonPath('data.items.0.nested', true)
            ->assertJsonPath('data.items.0.line_cost', 8)
            ->assertJsonPath('data.total_cost', 8);
    }

    public function test_no_inventory_transactions_are_created_by_template_management(): void
    {
        $admin = $this->admin();
        $parent = $this->product('Template');
        $component = $this->product('Component', 'ml', 10);

        $id = $this->actingAs($admin)
            ->postJson("/inventory/product/{$parent->id}/composition", $this->payload($parent, [[$component, 5]]))
            ->json('data.id');

        $this->actingAs($admin)
            ->putJson("/inventory/product/{$parent->id}/composition/{$id}", $this->payload($parent, [[$component, 8]]))
            ->assertOk();

        $activeId = ProductComposition::where('product_id', $parent->id)->where('is_active', true)->value('id');

        $this->actingAs($admin)
            ->deleteJson("/inventory/product/{$parent->id}/composition/{$activeId}")
            ->assertOk();

        $this->assertSame(0, InventoryTransaction::count());
        $this->assertSame(0, InventoryTransaction::where('type', 'consumption')->count());
        $this->assertSame(0, CompositionRun::count());
    }
}
