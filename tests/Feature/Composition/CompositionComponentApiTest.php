<?php

namespace Tests\Feature\Composition;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompositionComponentApiTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function product(array $overrides = []): Product
    {
        return Product::create(array_merge([
            'name' => 'Component '.uniqid(),
            'sku' => 'CMP-'.uniqid(),
            'base_unit_id' => 'piece',
            'track_inventory' => true,
            'stock_quantity' => 100,
            'status' => 'in-stock',
        ], $overrides));
    }

    public function test_component_search_is_server_side_and_excludes_invalid_products(): void
    {
        $admin = $this->admin();
        $parent = $this->product(['name' => 'Parent Product', 'sku' => 'PARENT-1']);

        $flour = $this->product(['name' => 'Flour', 'sku' => 'FLOUR-1', 'barcode' => 'BC-FLOUR-1']);
        $sugar = $this->product(['name' => 'Sugar', 'sku' => 'SUGAR-1']);
        $archived = $this->product(['name' => 'Archived Flour', 'sku' => 'FLOUR-OLD']);
        $archived->archived_at = now();
        $archived->save();
        $deleted = $this->product(['name' => 'Deleted Flour', 'sku' => 'FLOUR-DEL']);
        $deleted->delete();
        $service = $this->product(['name' => 'Flour Service', 'sku' => 'FLOUR-SVC', 'track_inventory' => false]);

        $response = $this->actingAs($admin)->getJson(
            "/inventory/composition/components?search=Flour&exclude_product_id={$parent->id}&per_page=10"
        );

        $response->assertOk()
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $flour->id)
            ->assertJsonPath('data.0.base_unit_id', 'piece')
            ->assertJsonPath('data.0.unit_options.0.is_base', true);

        $ids = collect($response->json('data'))->pluck('id')->all();

        $this->assertNotContains($parent->id, $ids);
        $this->assertNotContains($archived->id, $ids);
        $this->assertNotContains($deleted->id, $ids);
        $this->assertNotContains($service->id, $ids);
        $this->assertNotContains($sugar->id, $ids);
    }

    public function test_component_search_treats_zero_exclusion_as_absent(): void
    {
        // The inline "Add Formula" screen has no product id yet and sends
        // exclude_product_id=0. That must not fail validation and break search.
        $admin = $this->admin();
        $flour = $this->product(['name' => 'Zero Exclude Flour', 'sku' => 'ZEX-1']);

        $this->actingAs($admin)
            ->getJson('/inventory/composition/components?search=Zero%20Exclude&exclude_product_id=0&per_page=10')
            ->assertOk()
            ->assertJsonPath('data.0.id', $flour->id);
    }

    public function test_component_search_still_excludes_a_real_product_id(): void
    {
        $admin = $this->admin();
        $parent = $this->product(['name' => 'Real Parent', 'sku' => 'RLP-1']);

        $response = $this->actingAs($admin)
            ->getJson("/inventory/composition/components?search=Real%20Parent&exclude_product_id={$parent->id}")
            ->assertOk();

        $this->assertNotContains($parent->id, collect($response->json('data'))->pluck('id')->all());
    }

    public function test_component_search_matches_sku_and_barcode(): void
    {
        $admin = $this->admin();
        $product = $this->product([
            'name' => 'Special Ingredient',
            'sku' => 'SPECIAL-SKU-1',
            'barcode' => 'BARCODE-XYZ',
        ]);

        $this->actingAs($admin)
            ->getJson('/inventory/composition/components?search=SPECIAL-SKU')
            ->assertOk()
            ->assertJsonPath('data.0.id', $product->id);

        $this->actingAs($admin)
            ->getJson('/inventory/composition/components?search=BARCODE-XYZ')
            ->assertOk()
            ->assertJsonPath('data.0.id', $product->id);
    }

    public function test_unit_options_return_compatible_units_without_duplicates(): void
    {
        $admin = $this->admin();
        $product = $this->product(['name' => 'Flour', 'base_unit_id' => 'kg']);

        $response = $this->actingAs($admin)->getJson(
            "/inventory/composition/units?component_product_id={$product->id}"
        );

        $response->assertOk()
            ->assertJsonPath('data.base_unit_id', 'kg')
            ->assertJsonPath('data.measurement_type', 'weight');

        $options = collect($response->json('data.options'));
        $ids = $options->pluck('id')->all();

        $this->assertSame(count($ids), count(array_unique($ids)));
        $this->assertContains('kg', $ids);
        $this->assertContains('g', $ids);

        $kg = $options->firstWhere('id', 'kg');
        $gram = $options->firstWhere('id', 'g');

        $this->assertSame(1, $kg['factor']);
        $this->assertTrue($kg['is_base']);
        $this->assertSame(0.001, $gram['factor']);
        $this->assertFalse($gram['is_base']);
    }
}
