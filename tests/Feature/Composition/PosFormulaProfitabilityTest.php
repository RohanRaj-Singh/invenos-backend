<?php

namespace Tests\Feature\Composition;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\CompositionItemOverrideData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Composition\Services\CompositionService;
use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\DTOs\SaleItemData;
use App\Domains\Sales\Services\SaleService;
use App\Domains\Settings\DTOs\UpdateSettingsData;
use App\Domains\Settings\Services\SettingService;
use App\Models\CompositionRun;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\SellingUnit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * P17: POS profitability preview for runtime-customized formula quantities.
 *
 * The preview must use the same expansion and scaling as checkout, and must be
 * informational only (no stock movement, no run).
 */
class PosFormulaProfitabilityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::forget('app_settings');
        // Page-render assertions must not depend on built assets.
        $this->withoutVite();
    }

    private function user(string $role = 'admin'): User
    {
        return User::factory()->create(['role' => $role, 'active' => true]);
    }

    private function configureMargin(float $margin): void
    {
        app(SettingService::class)->update(
            UpdateSettingsData::fromRequest(['composition' => ['target_margin_percent' => $margin]])
        );
    }

    private function product(string $name, string $unit = 'g', float $price = 1000, float $factor = 1): Product
    {
        $product = Product::create([
            'name' => $name.' '.uniqid(),
            'sku' => 'P17-'.uniqid(),
            'base_unit_id' => $unit,
            'track_inventory' => true,
            'stock_quantity' => 0,
        ]);

        SellingUnit::create([
            'product_id' => $product->id,
            'name' => 'Formula',
            'unit_id' => $unit,
            'quantity' => $factor,
            'sale_price' => $price,
            'is_default' => true,
        ]);

        return $product;
    }

    private function ingredient(float $cost, float $stock = 1000, string $unit = 'g'): Product
    {
        return Product::create([
            'name' => 'Ingredient '.uniqid(),
            'sku' => 'ING-'.uniqid(),
            'base_unit_id' => $unit,
            'track_inventory' => true,
            'stock_quantity' => $stock,
            'average_cost' => $cost,
        ]);
    }

    /**
     * @param  array<int, array{0: Product, 1: float, 2?: float}>  $items  [ingredient, quantity, wastage]
     */
    private function composition(Product $formula, array $items, float $output = 1): ProductComposition
    {
        return app(CompositionService::class)->save(new SaveCompositionData(
            productId: $formula->id,
            kind: ProductComposition::KIND_CONSUMPTION,
            items: array_map(fn (array $row) => new CompositionItemData(
                componentProductId: $row[0]->id,
                quantityBase: $row[1],
                displayUnitId: $row[0]->base_unit_id,
                wastagePct: $row[2] ?? 0,
            ), $items),
            name: 'P17 formula',
            outputQuantity: $output,
            outputUnitId: $formula->base_unit_id,
        ), 'tester');
    }

    private function preview(Product $formula, array $payload, ?User $as = null)
    {
        return $this->actingAs($as ?? $this->user('admin'))
            ->postJson("/inventory/product/{$formula->id}/composition/cost-preview", $payload);
    }

    // ─── Cost semantics ───────────────────────────────────────

    public function test_default_quantities_use_the_template_cost(): void
    {
        $formula = $this->product('Formula');
        $ingredient = $this->ingredient(5);
        $composition = $this->composition($formula, [[$ingredient, 10]]);

        $this->preview($formula, ['composition_id' => $composition->id, 'quantity' => 1])
            ->assertOk()
            ->assertJsonPath('data.total_ingredient_cost', 50)
            ->assertJsonPath('data.cost_per_formula_unit', 50)
            ->assertJsonPath('data.cost_complete', true)
            ->assertJsonPath('data.formula_units', 1);
    }

    public function test_increasing_an_ingredient_increases_the_cost(): void
    {
        $formula = $this->product('Formula');
        $ingredient = $this->ingredient(5);
        $composition = $this->composition($formula, [[$ingredient, 10]]);
        $item = $composition->items()->firstOrFail();

        $this->preview($formula, [
            'composition_id' => $composition->id,
            'quantity' => 1,
            'overrides' => [['composition_item_id' => $item->id, 'quantity' => 20, 'unit_id' => 'g']],
        ])
            ->assertOk()
            ->assertJsonPath('data.total_ingredient_cost', 100);
    }

    public function test_decreasing_an_ingredient_decreases_the_cost(): void
    {
        $formula = $this->product('Formula');
        $ingredient = $this->ingredient(5);
        $composition = $this->composition($formula, [[$ingredient, 10]]);
        $item = $composition->items()->firstOrFail();

        $this->preview($formula, [
            'composition_id' => $composition->id,
            'quantity' => 1,
            'overrides' => [['composition_item_id' => $item->id, 'quantity' => 2, 'unit_id' => 'g']],
        ])
            ->assertOk()
            ->assertJsonPath('data.total_ingredient_cost', 10);
    }

    public function test_multiple_formula_units_scale_the_cost(): void
    {
        $formula = $this->product('Formula');
        $ingredient = $this->ingredient(5);
        $composition = $this->composition($formula, [[$ingredient, 10]]);

        $this->preview($formula, ['composition_id' => $composition->id, 'quantity' => 3])
            ->assertOk()
            ->assertJsonPath('data.total_ingredient_cost', 150)
            ->assertJsonPath('data.cost_per_formula_unit', 50)
            ->assertJsonPath('data.formula_units', 3);
    }

    public function test_overrides_are_per_formula_unit_and_scale_with_quantity(): void
    {
        $formula = $this->product('Formula');
        $ingredient = $this->ingredient(5);
        $composition = $this->composition($formula, [[$ingredient, 10]]);
        $item = $composition->items()->firstOrFail();

        // 20 g per formula x 2 formulas = 40 g x 5 = 200
        $this->preview($formula, [
            'composition_id' => $composition->id,
            'quantity' => 2,
            'overrides' => [['composition_item_id' => $item->id, 'quantity' => 20, 'unit_id' => 'g']],
        ])
            ->assertOk()
            ->assertJsonPath('data.total_ingredient_cost', 200)
            ->assertJsonPath('data.cost_per_formula_unit', 100);
    }

    public function test_selling_unit_factor_affects_consumption_like_checkout(): void
    {
        // A selling unit covering 2 g means quantity 1 consumes 2 formula units.
        $formula = $this->product('Formula', price: 1000, factor: 2);
        $ingredient = $this->ingredient(5);
        $composition = $this->composition($formula, [[$ingredient, 10]]);

        $this->preview($formula, ['composition_id' => $composition->id, 'quantity' => 1])
            ->assertOk()
            ->assertJsonPath('data.formula_units', 2)
            ->assertJsonPath('data.total_ingredient_cost', 100)
            ->assertJsonPath('data.cost_per_formula_unit', 50);
    }

    public function test_non_unit_yield_is_respected(): void
    {
        // Template yields 2 g from 10 g of a 5-per-g ingredient.
        // Selling 2 g (one full yield) = 1 formula unit = cost 50.
        $formula = $this->product('Formula');
        $ingredient = $this->ingredient(5);
        $composition = $this->composition($formula, [[$ingredient, 10]], output: 2);

        $this->preview($formula, ['composition_id' => $composition->id, 'quantity' => 2])
            ->assertOk()
            ->assertJsonPath('data.formula_units', 1)
            ->assertJsonPath('data.total_ingredient_cost', 50)
            ->assertJsonPath('data.cost_per_formula_unit', 50);

        // Selling 1 g is half a yield, so half the ingredients are consumed.
        $this->preview($formula, ['composition_id' => $composition->id, 'quantity' => 1])
            ->assertOk()
            ->assertJsonPath('data.formula_units', 0.5)
            ->assertJsonPath('data.total_ingredient_cost', 25);
    }

    public function test_wastage_applies_to_template_quantities_but_not_overrides(): void
    {
        $formula = $this->product('Formula');
        $ingredient = $this->ingredient(10);
        $composition = $this->composition($formula, [[$ingredient, 10, 50]]); // 10 g + 50% wastage
        $item = $composition->items()->firstOrFail();

        $this->preview($formula, ['composition_id' => $composition->id, 'quantity' => 1])
            ->assertOk()
            ->assertJsonPath('data.total_ingredient_cost', 150);

        $this->preview($formula, [
            'composition_id' => $composition->id,
            'quantity' => 1,
            'overrides' => [['composition_item_id' => $item->id, 'quantity' => 10, 'unit_id' => 'g']],
        ])
            ->assertOk()
            ->assertJsonPath('data.total_ingredient_cost', 100);
    }

    // ─── Profitability arithmetic ─────────────────────────────

    public function test_reference_example_from_the_brief(): void
    {
        $this->configureMargin(30);
        $formula = $this->product('Formula', price: 1000);
        $ingredient = $this->ingredient(9);
        $composition = $this->composition($formula, [[$ingredient, 10]]); // 90 per formula

        $this->preview($formula, [
            'composition_id' => $composition->id,
            'quantity' => 2,
            'unit_price' => 1000,
            'discount_amount' => 100,
        ])
            ->assertOk()
            ->assertJsonPath('data.gross_subtotal', 2000)
            ->assertJsonPath('data.discount_amount', 100)
            ->assertJsonPath('data.net_revenue', 1900)
            ->assertJsonPath('data.total_ingredient_cost', 180)
            ->assertJsonPath('data.gross_profit', 1720)
            ->assertJsonPath('data.gross_margin_percent', 90.53)
            ->assertJsonPath('data.target_margin_percent', 30)
            // 90 / 0.70 = 128.5714 -> 128.57
            ->assertJsonPath('data.recommended_price', 128.57);
    }

    public function test_percentage_discount_reduces_net_revenue(): void
    {
        $formula = $this->product('Formula', price: 1000);
        $ingredient = $this->ingredient(10);
        $composition = $this->composition($formula, [[$ingredient, 10]]);

        $this->preview($formula, [
            'composition_id' => $composition->id,
            'quantity' => 1,
            'discount_percent' => 10,
        ])
            ->assertOk()
            ->assertJsonPath('data.gross_subtotal', 1000)
            ->assertJsonPath('data.discount_amount', 100)
            ->assertJsonPath('data.net_revenue', 900)
            ->assertJsonPath('data.gross_profit', 800)
            ->assertJsonPath('data.gross_margin_percent', 88.89);
    }

    public function test_price_override_is_used_for_revenue(): void
    {
        $formula = $this->product('Formula', price: 1000);
        $ingredient = $this->ingredient(10);
        $composition = $this->composition($formula, [[$ingredient, 10]]);

        $this->preview($formula, [
            'composition_id' => $composition->id,
            'quantity' => 2,
            'unit_price' => 600,
        ])
            ->assertOk()
            ->assertJsonPath('data.selling_unit_price', 600)
            ->assertJsonPath('data.gross_subtotal', 1200)
            ->assertJsonPath('data.net_revenue', 1200);
    }

    public function test_zero_revenue_yields_no_margin(): void
    {
        $formula = $this->product('Formula', price: 1000);
        $ingredient = $this->ingredient(10);
        $composition = $this->composition($formula, [[$ingredient, 10]]);

        $this->preview($formula, [
            'composition_id' => $composition->id,
            'quantity' => 1,
            'unit_price' => 0,
        ])
            ->assertOk()
            ->assertJsonPath('data.net_revenue', 0)
            ->assertJsonPath('data.gross_margin_percent', null);
    }

    public function test_zero_cost_is_a_real_cost_not_incomplete(): void
    {
        $formula = $this->product('Formula', price: 500);
        $ingredient = $this->ingredient(0);
        $composition = $this->composition($formula, [[$ingredient, 10]]);

        $this->preview($formula, ['composition_id' => $composition->id, 'quantity' => 1])
            ->assertOk()
            ->assertJsonPath('data.cost_complete', true)
            ->assertJsonPath('data.total_ingredient_cost', 0)
            ->assertJsonPath('data.gross_profit', 500)
            ->assertJsonPath('data.gross_margin_percent', 100);
    }

    public function test_incomplete_cost_hides_profit_and_recommendation(): void
    {
        $formula = $this->product('Formula', price: 500);
        $ingredient = Product::create([
            'name' => 'Uncosted '.uniqid(),
            'sku' => 'UNC-'.uniqid(),
            'base_unit_id' => 'g',
            'track_inventory' => true,
            'stock_quantity' => 100,
        ]);
        $composition = $this->composition($formula, [[$ingredient, 10]]);

        $this->preview($formula, ['composition_id' => $composition->id, 'quantity' => 1])
            ->assertOk()
            ->assertJsonPath('data.cost_complete', false)
            ->assertJsonPath('data.total_ingredient_cost', null)
            ->assertJsonPath('data.gross_profit', null)
            ->assertJsonPath('data.gross_margin_percent', null)
            ->assertJsonPath('data.available', false)
            ->assertJsonPath('data.unavailable_reason', 'incomplete_cost');
    }

    // ─── Validation and security ──────────────────────────────

    public function test_quantity_is_required_and_positive(): void
    {
        $formula = $this->product('Formula');
        $ingredient = $this->ingredient(5);
        $composition = $this->composition($formula, [[$ingredient, 10]]);

        $this->preview($formula, ['composition_id' => $composition->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors('quantity');

        $this->preview($formula, ['composition_id' => $composition->id, 'quantity' => 0])
            ->assertStatus(422)
            ->assertJsonValidationErrors('quantity');
    }

    public function test_override_for_a_foreign_ingredient_is_rejected(): void
    {
        $formula = $this->product('Formula');
        $other = $this->product('Other');
        $ownIngredient = $this->ingredient(5);
        $composition = $this->composition($formula, [[$ownIngredient, 10]]);
        $foreignComposition = $this->composition($other, [[$this->ingredient(5), 10]]);
        $foreignItem = $foreignComposition->items()->firstOrFail();

        $this->preview($formula, [
            'composition_id' => $composition->id,
            'quantity' => 1,
            'overrides' => [['composition_item_id' => $foreignItem->id, 'quantity' => 99, 'unit_id' => 'g']],
        ])->assertStatus(422);
    }

    public function test_composition_of_another_product_is_rejected(): void
    {
        $formula = $this->product('Formula');
        $other = $this->product('Other');
        $this->composition($formula, [[$this->ingredient(5), 10]]);
        $foreign = $this->composition($other, [[$this->ingredient(5), 10]]);

        $this->preview($formula, ['composition_id' => $foreign->id, 'quantity' => 1])
            ->assertStatus(422);
    }

    public function test_preview_creates_no_runs_or_movements(): void
    {
        $formula = $this->product('Formula');
        $ingredient = $this->ingredient(5);
        $composition = $this->composition($formula, [[$ingredient, 10]]);

        $this->preview($formula, ['composition_id' => $composition->id, 'quantity' => 2])->assertOk();

        $this->assertSame(0, CompositionRun::count());
        $this->assertSame(0, InventoryTransaction::count());
        $this->assertSame(1000.0, (float) $ingredient->fresh()->stock_quantity);
    }

    public function test_preview_works_even_when_stock_is_short(): void
    {
        $formula = $this->product('Formula');
        $ingredient = $this->ingredient(5, stock: 0);
        $composition = $this->composition($formula, [[$ingredient, 10]]);

        // Informational only: a shortage must not block the preview.
        $this->preview($formula, ['composition_id' => $composition->id, 'quantity' => 1])
            ->assertOk()
            ->assertJsonPath('data.total_ingredient_cost', 50);
    }

    public function test_client_supplied_cost_and_profit_are_ignored(): void
    {
        $formula = $this->product('Formula', price: 1000);
        $ingredient = $this->ingredient(10);
        $composition = $this->composition($formula, [[$ingredient, 10]]);

        $this->preview($formula, [
            'composition_id' => $composition->id,
            'quantity' => 1,
            'total_ingredient_cost' => 1,
            'cost_per_formula_unit' => 1,
            'gross_profit' => 9999,
            'gross_margin_percent' => 99.99,
            'cost_complete' => false,
        ])
            ->assertOk()
            ->assertJsonPath('data.total_ingredient_cost', 100)
            ->assertJsonPath('data.gross_profit', 900)
            ->assertJsonPath('data.gross_margin_percent', 90)
            ->assertJsonPath('data.cost_complete', true);
    }

    // ─── Authorization ────────────────────────────────────────

    public function test_unauthorized_user_is_forbidden(): void
    {
        $formula = $this->product('Formula');
        $ingredient = $this->ingredient(5);
        $composition = $this->composition($formula, [[$ingredient, 10]]);

        $this->preview($formula, ['composition_id' => $composition->id, 'quantity' => 1], $this->user('salesman'))
            ->assertForbidden();
    }

    public function test_guest_is_unauthenticated(): void
    {
        $formula = $this->product('Formula');
        $ingredient = $this->ingredient(5);
        $composition = $this->composition($formula, [[$ingredient, 10]]);

        $this->postJson("/inventory/product/{$formula->id}/composition/cost-preview", [
            'composition_id' => $composition->id,
            'quantity' => 1,
        ])->assertUnauthorized();
    }

    public function test_pos_page_exposes_cost_capability_per_role(): void
    {
        $this->actingAs($this->user('admin'))
            ->get('/sales/pos')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('can_view_cost', true));

        $this->actingAs($this->user('salesman'))
            ->get('/sales/pos')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('can_view_cost', false));
    }

    public function test_unauthorized_user_can_still_sell_a_formula(): void
    {
        $salesman = $this->user('salesman');
        $formula = $this->product('Formula', price: 1000);
        $ingredient = $this->ingredient(5);
        $composition = $this->composition($formula, [[$ingredient, 10]]);

        // The preview is refused...
        $this->preview($formula, ['composition_id' => $composition->id, 'quantity' => 1], $salesman)
            ->assertForbidden();

        // ...but checkout is unaffected.
        $this->actingAs($salesman)->post('/sales', [
            'items' => [[
                'product_id' => $formula->id,
                'quantity' => 1,
                'packaging_quantity' => 1,
                'selling_unit_id' => $formula->sellingUnits()->firstOrFail()->id,
                'unit_price' => 1000,
                'total' => 1000,
                'formula_composition_id' => $composition->id,
            ]],
            'discount' => 0,
            'amount_paid' => 1000,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'source' => 'pos',
        ])->assertRedirect();

        $this->assertSame(990.0, round((float) $ingredient->fresh()->stock_quantity, 6));
        $this->assertSame(1, CompositionRun::count());
    }

    // ─── Preview/checkout equivalence ─────────────────────────

    public function test_preview_cost_matches_the_actual_checkout_snapshot(): void
    {
        $formula = $this->product('Formula', price: 1000);
        $first = $this->ingredient(5);
        $second = $this->ingredient(3);
        $composition = $this->composition($formula, [[$first, 10], [$second, 4]]);

        $preview = $this->preview($formula, [
            'composition_id' => $composition->id,
            'quantity' => 2,
            'overrides' => [[
                'composition_item_id' => $composition->items()->firstOrFail()->id,
                'quantity' => 20,
                'unit_id' => 'g',
            ]],
        ])->assertOk();

        $previewCost = (float) $preview->json('data.total_ingredient_cost');

        // Now perform the equivalent real sale.
        $items = $composition->items()->orderBy('id')->get();
        app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-P17-'.uniqid(),
            customerId: 0,
            customerName: 'Walk-in',
            date: now()->format('Y-m-d'),
            items: [new SaleItemData(
                $formula->id, $formula->name, 2, 1, 2, 1000, 2000, $formula->base_unit_id, 0, 'General',
                formulaCompositionId: $composition->id,
                formulaOverrides: [
                    CompositionItemOverrideData::fromArray([
                        'composition_item_id' => $items[0]->id,
                        'quantity' => 20,
                        'unit_id' => 'g',
                    ]),
                ],
            )],
            discount: 0,
            amountPaid: 2000,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'tester',
        ));

        $run = CompositionRun::with('items')->firstOrFail();
        $snapshotCost = (float) $run->items->sum('total_cost');

        $this->assertSame(round($snapshotCost, 6), round($previewCost, 6));
    }
}
