<?php

namespace Tests\Feature\Composition;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Live costing for an unsaved formula on the Add Formula screen.
 */
class CompositionDraftCostTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role): User
    {
        return User::factory()->create(['role' => $role, 'active' => true]);
    }

    private function product(string $name, float $cost): Product
    {
        return Product::create([
            'name' => $name,
            'sku' => 'DRF-'.uniqid(),
            'base_unit_id' => 'g',
            'track_inventory' => true,
            'stock_quantity' => 100,
            'average_cost' => $cost,
        ]);
    }

    private function payload(array $items, float $outputQuantity = 1): array
    {
        return [
            'base_unit_id' => 'g',
            'output_quantity' => $outputQuantity,
            'output_unit_id' => 'g',
            'items' => $items,
        ];
    }

    public function test_draft_cost_sums_ingredient_lines_without_a_saved_product(): void
    {
        $a = $this->product('Ingredient A', 10);
        $b = $this->product('Ingredient B', 4);

        $this->actingAs($this->user('admin'))
            ->postJson('/inventory/composition/draft-preview', $this->payload([
                ['component_product_id' => $a->id, 'quantity' => 2, 'unit_id' => 'g'],
                ['component_product_id' => $b->id, 'quantity' => 5, 'unit_id' => 'g'],
            ], 2))
            ->assertOk()
            ->assertJsonPath('data.total_cost', 40)
            ->assertJsonPath('data.unit_cost', 20)
            ->assertJsonPath('data.complete', true)
            ->assertJsonPath('data.cost_basis', 'exact')
            ->assertJsonCount(2, 'data.items');
    }

    public function test_draft_cost_applies_wastage(): void
    {
        $a = $this->product('Ingredient A', 10);

        $this->actingAs($this->user('admin'))
            ->postJson('/inventory/composition/draft-preview', $this->payload([
                ['component_product_id' => $a->id, 'quantity' => 10, 'unit_id' => 'g', 'wastage_pct' => 10],
            ]))
            ->assertOk()
            ->assertJsonPath('data.total_cost', 110);
    }

    public function test_draft_cost_is_incomplete_when_an_ingredient_has_no_cost(): void
    {
        $costed = $this->product('Costed', 10);
        $uncosted = $this->product('Uncosted', 0);
        $uncosted->average_cost = null;
        $uncosted->last_purchase_cost = null;
        $uncosted->default_purchase_cost = null;
        $uncosted->save();

        $this->actingAs($this->user('admin'))
            ->postJson('/inventory/composition/draft-preview', $this->payload([
                ['component_product_id' => $costed->id, 'quantity' => 1, 'unit_id' => 'g'],
                ['component_product_id' => $uncosted->id, 'quantity' => 1, 'unit_id' => 'g'],
            ]))
            ->assertOk()
            ->assertJsonPath('data.total_cost', null)
            ->assertJsonPath('data.unit_cost', null)
            ->assertJsonPath('data.complete', false);
    }

    public function test_draft_cost_is_forbidden_without_the_cost_permission(): void
    {
        $a = $this->product('Ingredient A', 10);

        $this->actingAs($this->user('salesman'))
            ->postJson('/inventory/composition/draft-preview', $this->payload([
                ['component_product_id' => $a->id, 'quantity' => 1, 'unit_id' => 'g'],
            ]))
            ->assertForbidden();
    }

    public function test_draft_cost_requires_a_positive_output_quantity(): void
    {
        $a = $this->product('Ingredient A', 10);

        $this->actingAs($this->user('admin'))
            ->postJson('/inventory/composition/draft-preview', $this->payload([
                ['component_product_id' => $a->id, 'quantity' => 1, 'unit_id' => 'g'],
            ], 0))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['output_quantity']);
    }
}
