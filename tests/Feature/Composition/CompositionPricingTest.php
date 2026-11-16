<?php

namespace Tests\Feature\Composition;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Composition\Services\CompositionPricingService;
use App\Domains\Composition\Services\CompositionService;
use App\Domains\Settings\DTOs\UpdateSettingsData;
use App\Domains\Settings\Services\SettingService;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\SellingUnit;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * P16: target gross margin and recommended selling price.
 *
 * The mathematics is a MARGIN, not a markup:
 *   price = cost / (1 - margin/100)
 */
class CompositionPricingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // SettingService memoises the whole settings array; a stale entry could
        // carry a margin between tests.
        Cache::forget('app_settings');
        // These tests assert that pages resolve, not that assets were built.
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

    private function sellingUnit(float $price, float $quantity = 1): SellingUnit
    {
        return (new SellingUnit)->forceFill([
            'name' => 'Formula',
            'unit_id' => 'g',
            'quantity' => $quantity,
            'sale_price' => $price,
            'is_default' => true,
        ]);
    }

    /** @return array<string, mixed> */
    private function cost(?float $unitCost, bool $complete = true): array
    {
        return [
            'unit_cost' => $unitCost,
            'total_cost' => $unitCost,
            'cost_basis' => $complete ? 'exact' : 'unavailable',
            'complete' => $complete,
            'is_estimated' => false,
            'output_quantity_base' => 1,
        ];
    }

    private function product(string $name = 'Formula', float $price = 1000): Product
    {
        $product = Product::create([
            'name' => $name.' '.uniqid(),
            'sku' => 'PRC-'.uniqid(),
            'base_unit_id' => 'g',
            'track_inventory' => true,
            'stock_quantity' => 0,
        ]);

        SellingUnit::create([
            'product_id' => $product->id,
            'name' => 'Formula',
            'unit_id' => 'g',
            'quantity' => 1,
            'sale_price' => $price,
            'is_default' => true,
        ]);

        return $product;
    }

    private function ingredient(float $cost, string $name = 'Ingredient'): Product
    {
        return Product::create([
            'name' => $name.' '.uniqid(),
            'sku' => 'ING-'.uniqid(),
            'base_unit_id' => 'g',
            'track_inventory' => true,
            'stock_quantity' => 100,
            'average_cost' => $cost,
        ]);
    }

    private function composition(Product $product, Product $ingredient, float $quantity = 1): ProductComposition
    {
        return app(CompositionService::class)->save(new SaveCompositionData(
            productId: $product->id,
            kind: ProductComposition::KIND_CONSUMPTION,
            items: [new CompositionItemData(
                componentProductId: $ingredient->id,
                quantityBase: $quantity,
                displayUnitId: 'g',
            )],
            name: 'Pricing formula',
            outputQuantity: 1,
            outputUnitId: 'g',
        ), 'tester');
    }

    // ─── Settings ─────────────────────────────────────────────

    public function test_default_target_margin_is_thirty_percent(): void
    {
        $this->assertSame(30.0, app(CompositionPricingService::class)->targetMarginPercent());
    }

    public function test_configured_target_margin_is_used(): void
    {
        $this->configureMargin(42.5);

        $this->assertSame(42.5, app(CompositionPricingService::class)->targetMarginPercent());
    }

    public function test_decimal_margin_is_accepted_over_http(): void
    {
        $this->actingAs($this->user('admin'))
            ->put('/settings', ['composition' => ['target_margin_percent' => 12.75]])
            ->assertSessionHasNoErrors();

        $this->assertSame(12.75, app(CompositionPricingService::class)->targetMarginPercent());
    }

    public function test_margin_at_or_above_one_hundred_is_rejected(): void
    {
        $admin = $this->user('admin');

        $this->actingAs($admin)
            ->put('/settings', ['composition' => ['target_margin_percent' => 100]])
            ->assertSessionHasErrors('composition.target_margin_percent');

        $this->actingAs($admin)
            ->put('/settings', ['composition' => ['target_margin_percent' => 150]])
            ->assertSessionHasErrors('composition.target_margin_percent');
    }

    public function test_negative_margin_is_rejected(): void
    {
        $this->actingAs($this->user('admin'))
            ->put('/settings', ['composition' => ['target_margin_percent' => -5]])
            ->assertSessionHasErrors('composition.target_margin_percent');
    }

    public function test_margin_setting_is_admin_only(): void
    {
        $this->actingAs($this->user('salesman'))
            ->put('/settings', ['composition' => ['target_margin_percent' => 40]])
            ->assertForbidden();

        $this->assertSame(30.0, app(CompositionPricingService::class)->targetMarginPercent());
    }

    public function test_settings_are_application_scoped(): void
    {
        // There is no per-company settings dimension on this branch; the value
        // is stored in the single settings row and read by every request.
        $this->configureMargin(35);

        $this->assertDatabaseCount('settings', 1);
        $this->assertSame(35.0, app(CompositionPricingService::class)->targetMarginPercent());
    }

    // ─── Mathematics ──────────────────────────────────────────

    public function test_thirty_percent_margin_matches_the_reference_example(): void
    {
        $this->configureMargin(30);
        $service = app(CompositionPricingService::class);

        $result = $service->summarizeFromCost($this->cost(700), $this->sellingUnit(850));

        // 700 / 0.70 = 1000, NOT 700 x 1.30 = 910.
        $this->assertSame(1000.0, $result['recommended_price']);
        $this->assertSame(300.0, $result['recommended_profit']);
        $this->assertSame(150.0, $result['profit']);
        $this->assertSame(17.65, $result['margin_percent']);
        $this->assertTrue($result['available']);
        $this->assertNull($result['unavailable_reason']);
    }

    public function test_margin_is_not_markup(): void
    {
        $this->configureMargin(30);

        $result = app(CompositionPricingService::class)
            ->summarizeFromCost($this->cost(700), $this->sellingUnit(700));

        $this->assertNotSame(910.0, $result['recommended_price']);
        $this->assertSame(1000.0, $result['recommended_price']);
    }

    public function test_fifty_percent_margin_doubles_the_cost(): void
    {
        $this->configureMargin(50);

        $result = app(CompositionPricingService::class)
            ->summarizeFromCost($this->cost(250), $this->sellingUnit(300));

        $this->assertSame(500.0, $result['recommended_price']);
        $this->assertSame(250.0, $result['recommended_profit']);
    }

    public function test_zero_percent_margin_recommends_the_cost(): void
    {
        $this->configureMargin(0);

        $result = app(CompositionPricingService::class)
            ->summarizeFromCost($this->cost(700), $this->sellingUnit(900));

        $this->assertSame(700.0, $result['recommended_price']);
        $this->assertSame(0.0, $result['recommended_profit']);
    }

    public function test_decimal_costs_round_to_the_minor_unit(): void
    {
        $this->configureMargin(33.33);

        $result = app(CompositionPricingService::class)
            ->summarizeFromCost($this->cost(100), $this->sellingUnit(200));

        // 100 / 0.6667 = 149.99250... → 149.99
        $this->assertSame(149.99, $result['recommended_price']);
    }

    public function test_cost_is_scaled_by_the_selling_unit_quantity(): void
    {
        $this->configureMargin(50);

        // unit_cost 10 per base unit x 5 base units per selling unit = 50
        $result = app(CompositionPricingService::class)
            ->summarizeFromCost($this->cost(10), $this->sellingUnit(100, 5));

        $this->assertSame(50.0, $result['estimated_cost']);
        $this->assertSame(50.0, $result['profit']);
        $this->assertSame(50.0, $result['margin_percent']);
        $this->assertSame(100.0, $result['recommended_price']);
    }

    // ─── Cost completeness ────────────────────────────────────

    public function test_incomplete_cost_yields_no_recommendation(): void
    {
        $this->configureMargin(30);

        $result = app(CompositionPricingService::class)
            ->summarizeFromCost($this->cost(null, false), $this->sellingUnit(500));

        $this->assertFalse($result['available']);
        $this->assertNull($result['recommended_price']);
        $this->assertNull($result['recommended_profit']);
        $this->assertSame('incomplete_cost', $result['unavailable_reason']);
        $this->assertNull($result['estimated_cost']);
    }

    public function test_zero_cost_is_treated_as_a_real_cost_not_missing(): void
    {
        $this->configureMargin(30);

        $result = app(CompositionPricingService::class)
            ->summarizeFromCost($this->cost(0), $this->sellingUnit(100));

        $this->assertTrue($result['available']);
        $this->assertSame(0.0, $result['estimated_cost']);
        $this->assertSame(0.0, $result['recommended_price']);
        $this->assertSame(100.0, $result['profit']);
        $this->assertSame(100.0, $result['margin_percent']);
    }

    public function test_zero_selling_price_does_not_produce_infinite_margin(): void
    {
        $this->configureMargin(30);

        $result = app(CompositionPricingService::class)
            ->summarizeFromCost($this->cost(50), $this->sellingUnit(0));

        $this->assertNull($result['margin_percent']);
        $this->assertSame(-50.0, $result['profit']);
        $this->assertTrue(is_finite($result['recommended_price']));
    }

    public function test_missing_selling_unit_yields_no_price_and_no_margin(): void
    {
        $this->configureMargin(30);

        $result = app(CompositionPricingService::class)->summarizeFromCost($this->cost(50), null);

        $this->assertNull($result['selling_price']);
        $this->assertNull($result['profit']);
        $this->assertNull($result['margin_percent']);
        $this->assertSame(71.43, $result['recommended_price']);
    }

    public function test_configured_margin_is_clamped_to_a_safe_range(): void
    {
        // A stored value outside the range must not divide by zero.
        Setting::create(['values' => array_merge(
            app(SettingService::class)->defaults(),
            ['composition' => ['target_margin_percent' => 250]],
        )]);
        Cache::forget('app_settings');

        $result = app(CompositionPricingService::class)
            ->summarizeFromCost($this->cost(100), $this->sellingUnit(200));

        $this->assertTrue(is_finite($result['recommended_price']));
        $this->assertLessThan(100, $result['target_margin_percent']);
    }

    // ─── Authorization and API ────────────────────────────────

    public function test_authorized_user_receives_pricing_on_the_composition(): void
    {
        $admin = $this->user('admin');
        $formula = $this->product('Priced', 1000);
        $ingredient = $this->ingredient(70);
        $this->composition($formula, $ingredient, 10); // cost 700 at 30%

        $response = $this->actingAs($admin)
            ->getJson("/inventory/product/{$formula->id}/composition?kind=consumption")
            ->assertOk();

        $response->assertJsonPath('data.pricing.target_margin_percent', 30);
        $response->assertJsonPath('data.pricing.estimated_cost', 700);
        $response->assertJsonPath('data.pricing.recommended_price', 1000);
        $response->assertJsonPath('data.pricing.profit', 300);
        $response->assertJsonPath('data.pricing.available', true);
    }

    public function test_unauthorized_user_receives_no_pricing_metadata(): void
    {
        $admin = $this->user('admin');
        $salesman = $this->user('salesman');
        $formula = $this->product('Priced', 1000);
        $ingredient = $this->ingredient(70);
        $this->composition($formula, $ingredient, 10);

        $this->actingAs($admin)->getJson("/inventory/product/{$formula->id}/composition?kind=consumption")->assertOk();

        $response = $this->actingAs($salesman)
            ->getJson("/inventory/product/{$formula->id}/composition?kind=consumption")
            ->assertOk();

        $response->assertJsonMissingPath('data.pricing');
        $response->assertJsonMissingPath('data.estimated_cost');

        // Nothing cost-derived may appear anywhere in the payload.
        $json = json_encode($response->json());
        foreach (['pricing', 'recommended_price', 'margin_percent', 'target_margin_percent', 'estimated_cost'] as $needle) {
            $this->assertStringNotContainsString($needle, $json);
        }
    }

    public function test_version_history_hides_pricing_from_unauthorized_users(): void
    {
        $salesman = $this->user('salesman');
        $formula = $this->product('Priced', 1000);
        $this->composition($formula, $this->ingredient(70), 10);

        $this->actingAs($salesman)
            ->getJson("/inventory/product/{$formula->id}/compositions")
            ->assertOk()
            ->assertJsonMissingPath('data.0.pricing');
    }

    public function test_cost_preview_returns_pricing_for_authorized_users(): void
    {
        $admin = $this->user('admin');
        $formula = $this->product('Priced', 1000);
        $ingredient = $this->ingredient(70);

        $this->actingAs($admin)
            ->postJson("/inventory/product/{$formula->id}/composition/preview", [
                'kind' => ProductComposition::KIND_CONSUMPTION,
                'output_quantity' => 1,
                'output_unit_id' => 'g',
                'items' => [[
                    'component_product_id' => $ingredient->id,
                    'quantity' => 10,
                    'unit_id' => 'g',
                ]],
            ])
            ->assertOk()
            ->assertJsonPath('data.pricing.recommended_price', 1000);
    }

    public function test_pricing_does_not_change_the_selling_price(): void
    {
        $admin = $this->user('admin');
        $formula = $this->product('Priced', 850);
        $this->composition($formula, $this->ingredient(70), 10);

        $this->actingAs($admin)
            ->getJson("/inventory/product/{$formula->id}/composition?kind=consumption")
            ->assertOk()
            ->assertJsonPath('data.pricing.selling_price', 850)
            ->assertJsonPath('data.pricing.recommended_price', 1000);

        // The stored price is untouched by merely reading the recommendation.
        $this->assertSame(850.0, (float) $formula->fresh()->sellingUnits()->first()->sale_price);
    }

    public function test_formula_detail_page_still_renders(): void
    {
        $admin = $this->user('admin');
        $formula = $this->product('Priced', 1000);
        $this->composition($formula, $this->ingredient(70), 10);

        $this->actingAs($admin)
            ->get("/inventory/product/{$formula->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('can_view_cost', true));
    }

    public function test_formula_pricing_settings_page_renders_with_current_margin(): void
    {
        $this->configureMargin(27.5);

        $this->actingAs($this->user('admin'))
            ->get('/settings/composition')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('settings/Composition')
                ->where('settings.composition.target_margin_percent', 27.5));
    }
}
