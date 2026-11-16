<?php

namespace Tests\Feature\Products;

use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * P15 Phase 4: a product and its first formula version can be created in one
 * request, and a rejected composition must leave no product behind.
 */
class ProductFormulaCreationTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role = 'admin'): User
    {
        return User::factory()->create(['role' => $role, 'active' => true]);
    }

    private function ingredient(string $name = 'Ingredient', string $unit = 'g'): Product
    {
        return Product::create([
            'name' => $name.' '.uniqid(),
            'sku' => 'ING-'.uniqid(),
            'base_unit_id' => $unit,
            'track_inventory' => true,
            'stock_quantity' => 100,
            'average_cost' => 2,
            'status' => 'in-stock',
        ]);
    }

    private function productPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Formula '.uniqid(),
            'sku' => 'FRM-'.uniqid(),
            'base_unit_id' => 'g',
            'selling_units' => [[
                'name' => 'Gram',
                'sale_price' => 500,
                'quantity' => 1,
            ]],
        ], $overrides);
    }

    private function compositionPayload(array $items, array $overrides = []): array
    {
        return array_merge([
            'kind' => ProductComposition::KIND_CONSUMPTION,
            'name' => 'Signature blend',
            'output_quantity' => 1,
            'output_unit_id' => 'g',
            'notes' => 'Mixed on demand',
            'items' => $items,
        ], $overrides);
    }

    public function test_product_only_creation_is_unchanged(): void
    {
        $admin = $this->user();
        $payload = $this->productPayload(['name' => 'Plain Product', 'sku' => 'PLN-1']);

        $this->actingAs($admin)->post('/inventory', $payload)->assertRedirect();

        $product = Product::where('sku', 'PLN-1')->firstOrFail();
        $this->assertSame('Plain Product', $product->name);
        $this->assertSame(0, ProductComposition::where('product_id', $product->id)->count());
    }

    public function test_product_and_formula_are_created_together(): void
    {
        $admin = $this->user();
        $first = $this->ingredient('Ashwagandha');
        $second = $this->ingredient('Turmeric');

        $payload = $this->productPayload([
            'name' => 'Joint Pain Formula',
            'sku' => 'JPF-1',
            'composition' => $this->compositionPayload([
                ['component_product_id' => $first->id, 'quantity' => 10, 'unit_id' => 'g', 'wastage_pct' => 5],
                ['component_product_id' => $second->id, 'quantity' => 50, 'unit_id' => 'g'],
            ]),
        ]);

        $this->actingAs($admin)->post('/inventory', $payload)->assertRedirect();

        $formula = Product::where('sku', 'JPF-1')->firstOrFail();
        $composition = ProductComposition::where('product_id', $formula->id)->firstOrFail();

        $this->assertSame(1, $composition->version);
        $this->assertTrue((bool) $composition->is_active);
        $this->assertSame(ProductComposition::KIND_CONSUMPTION, $composition->kind);
        $this->assertSame('Signature blend', $composition->name);
        $this->assertSame(2, $composition->items()->count());
    }

    public function test_formula_yield_and_notes_are_persisted(): void
    {
        $admin = $this->user();
        $ingredient = $this->ingredient();

        $payload = $this->productPayload([
            'sku' => 'YLD-1',
            'composition' => $this->compositionPayload(
                [['component_product_id' => $ingredient->id, 'quantity' => 10, 'unit_id' => 'g']],
                ['output_quantity' => 2, 'notes' => 'Twice the yield'],
            ),
        ]);

        $this->actingAs($admin)->post('/inventory', $payload)->assertRedirect();

        $composition = ProductComposition::whereHas(
            'product',
            fn ($q) => $q->where('sku', 'YLD-1')
        )->firstOrFail();

        $this->assertSame(2.0, (float) $composition->output_quantity);
        $this->assertSame('Twice the yield', $composition->notes);
    }

    public function test_invalid_ingredient_rolls_back_the_product(): void
    {
        $admin = $this->user();

        $payload = $this->productPayload([
            'sku' => 'BAD-1',
            'composition' => $this->compositionPayload([
                ['component_product_id' => 999999, 'quantity' => 5, 'unit_id' => 'g'],
            ]),
        ]);

        $this->actingAs($admin)->post('/inventory', $payload)->assertSessionHasErrors();

        $this->assertSame(0, Product::where('sku', 'BAD-1')->count());
        $this->assertSame(0, ProductComposition::count());
    }

    public function test_composition_without_items_rolls_back_the_product(): void
    {
        $admin = $this->user();

        $payload = $this->productPayload([
            'sku' => 'EMPTY-1',
            'composition' => $this->compositionPayload([]),
        ]);

        $this->actingAs($admin)->post('/inventory', $payload)->assertSessionHasErrors();

        $this->assertSame(0, Product::where('sku', 'EMPTY-1')->count());
    }

    public function test_archived_ingredient_rolls_back_the_product(): void
    {
        $admin = $this->user();
        $ingredient = $this->ingredient();
        // `archived_at` is not mass-assignable; force it so the archive actually applies.
        $ingredient->forceFill(['archived_at' => now()])->save();

        $payload = $this->productPayload([
            'sku' => 'ARCH-1',
            'composition' => $this->compositionPayload([
                ['component_product_id' => $ingredient->id, 'quantity' => 5, 'unit_id' => 'g'],
            ]),
        ]);

        $this->actingAs($admin)->post('/inventory', $payload)->assertSessionHasErrors();

        $this->assertSame(0, Product::where('sku', 'ARCH-1')->count());
    }

    public function test_duplicate_ingredient_is_rejected_and_rolled_back(): void
    {
        $admin = $this->user();
        $ingredient = $this->ingredient();

        $payload = $this->productPayload([
            'sku' => 'DUP-1',
            'composition' => $this->compositionPayload([
                ['component_product_id' => $ingredient->id, 'quantity' => 5, 'unit_id' => 'g'],
                ['component_product_id' => $ingredient->id, 'quantity' => 7, 'unit_id' => 'g'],
            ]),
        ]);

        $this->actingAs($admin)->post('/inventory', $payload)->assertSessionHasErrors();

        $this->assertSame(0, Product::where('sku', 'DUP-1')->count());
    }

    public function test_salesman_cannot_create_a_formula_inline(): void
    {
        $salesman = $this->user('salesman');
        $ingredient = $this->ingredient();

        $payload = $this->productPayload([
            'sku' => 'DENY-1',
            'composition' => $this->compositionPayload([
                ['component_product_id' => $ingredient->id, 'quantity' => 5, 'unit_id' => 'g'],
            ]),
        ]);

        // Salesmen already cannot create products at all, so this must deny.
        $this->actingAs($salesman)->post('/inventory', $payload)->assertForbidden();

        $this->assertSame(0, Product::where('sku', 'DENY-1')->count());
    }
}
