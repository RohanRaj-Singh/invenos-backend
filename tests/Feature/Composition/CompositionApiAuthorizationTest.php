<?php

namespace Tests\Feature\Composition;

use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompositionApiAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role = 'admin', bool $active = true): User
    {
        return User::factory()->create(['role' => $role, 'active' => $active]);
    }

    private function product(string $name = 'Product', string $unit = 'piece', ?float $cost = 10): Product
    {
        return Product::create([
            'name' => $name.' '.uniqid(),
            'sku' => 'AUTH-'.uniqid(),
            'base_unit_id' => $unit,
            'track_inventory' => true,
            'stock_quantity' => 100,
            'average_cost' => $cost,
            'status' => 'in-stock',
        ]);
    }

    private function payload(Product $parent, Product $component): array
    {
        return [
            'kind' => ProductComposition::KIND_CONSUMPTION,
            'output_quantity' => 1,
            'output_unit_id' => $parent->base_unit_id,
            'items' => [[
                'component_product_id' => $component->id,
                'quantity' => 1,
                'unit_id' => $component->base_unit_id,
            ]],
        ];
    }

    private function createdComposition(User $admin, Product $parent, Product $component): int
    {
        return $this->actingAs($admin)
            ->postJson("/inventory/product/{$parent->id}/composition", $this->payload($parent, $component))
            ->json('data.id');
    }

    public function test_guest_is_unauthenticated(): void
    {
        $parent = $this->product('Guest Parent');

        $this->getJson("/inventory/product/{$parent->id}/compositions")->assertUnauthorized();
        $this->getJson('/inventory/composition/components')->assertUnauthorized();
    }

    public function test_salesman_can_view_but_cannot_manage(): void
    {
        $admin = $this->user('admin');
        $salesman = $this->user('salesman');
        $parent = $this->product('Sales Parent');
        $component = $this->product('Sales Component');
        $id = $this->createdComposition($admin, $parent, $component);

        $this->actingAs($salesman)
            ->getJson("/inventory/product/{$parent->id}/compositions")
            ->assertOk();

        $this->actingAs($salesman)
            ->getJson("/inventory/product/{$parent->id}/composition?kind=consumption")
            ->assertOk();

        $this->actingAs($salesman)
            ->postJson("/inventory/product/{$parent->id}/composition", $this->payload($parent, $component))
            ->assertForbidden();

        $this->actingAs($salesman)
            ->putJson("/inventory/product/{$parent->id}/composition/{$id}", $this->payload($parent, $component))
            ->assertForbidden();

        $this->actingAs($salesman)
            ->deleteJson("/inventory/product/{$parent->id}/composition/{$id}")
            ->assertForbidden();

        // Preview returns nothing but cost, so it requires the cost permission.
        $this->actingAs($salesman)
            ->postJson("/inventory/product/{$parent->id}/composition/preview", $this->payload($parent, $component))
            ->assertForbidden();

        $this->actingAs($salesman)
            ->getJson('/inventory/composition/components')
            ->assertOk();
    }

    public function test_inactive_admin_is_denied_view_and_manage(): void
    {
        $inactive = $this->user('admin', false);
        $parent = $this->product('Inactive Parent');
        $component = $this->product('Inactive Component');

        $this->actingAs($inactive)
            ->getJson("/inventory/product/{$parent->id}/compositions")
            ->assertForbidden();

        $this->actingAs($inactive)
            ->postJson("/inventory/product/{$parent->id}/composition", $this->payload($parent, $component))
            ->assertForbidden();
    }
}
