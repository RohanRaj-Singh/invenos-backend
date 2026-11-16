<?php

namespace Tests\Feature\Composition;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Composition\Services\CompositionService;
use App\Domains\Inventory\Services\InventoryService;
use App\Domains\Reports\DTOs\ReportFilters;
use App\Domains\Reports\Services\InventoryReportService;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\SellingUnit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FormulaScopeCleanupTest extends TestCase
{
    use RefreshDatabase;

    private function product(
        string $name,
        string $unit = 'g',
        float $stock = 0,
        float $price = 100,
    ): Product {
        $product = Product::create([
            'name' => $name.' '.uniqid(),
            'sku' => 'P10-'.uniqid(),
            'base_unit_id' => $unit,
            'track_inventory' => true,
            'stock_quantity' => $stock,
            'status' => $stock > 0 ? 'in-stock' : 'out-of-stock',
            'allow_negative_stock' => false,
        ]);

        SellingUnit::create([
            'product_id' => $product->id,
            'name' => $unit,
            'unit_id' => $unit,
            'quantity' => 1,
            'sale_price' => $price,
            'is_default' => true,
        ]);

        return $product;
    }

    private function formula(Product $formula, Product $ingredient): ProductComposition
    {
        return app(CompositionService::class)->save(new SaveCompositionData(
            productId: $formula->id,
            kind: ProductComposition::KIND_CONSUMPTION,
            items: [new CompositionItemData(
                componentProductId: $ingredient->id,
                quantityBase: 10,
                displayUnitId: $ingredient->base_unit_id,
            )],
            name: 'Joint Pain Formula',
            outputQuantity: 1,
            outputUnitId: $formula->base_unit_id,
        ), 'tester');
    }

    public function test_formula_only_product_is_excluded_from_stock_alerts_and_valuation(): void
    {
        $formula = $this->product('Formula', 'g', 0, 500);
        $ingredient = $this->product('Ashwagandha', 'g', 500, 5);
        $this->formula($formula, $ingredient);

        $inventory = app(InventoryService::class);
        $lowStockIds = collect($inventory->getLowStock())->pluck('id');
        $valuationIds = collect($inventory->getValuation()['by_category'])->pluck('category');

        $this->assertFalse($lowStockIds->contains($formula->id));
        $this->assertTrue($lowStockIds->contains($ingredient->id) === false, 'Ingredient has stock, so it is not low.');
        $this->assertNotEmpty($valuationIds);

        $overview = $inventory->getOverview();
        $this->assertSame(1, $overview['total_products']);
    }

    public function test_formula_only_product_is_excluded_from_inventory_reports(): void
    {
        $formula = $this->product('Formula', 'g', 0, 500);
        $ingredient = $this->product('Turmeric', 'g', 500, 5);
        $this->formula($formula, $ingredient);

        $reports = app(InventoryReportService::class);
        $filters = new ReportFilters(perPage: 50);

        $stock = $reports->stockReport($filters);
        $names = collect($stock['products'] ?? $stock['valuation'] ?? [])->pluck('product');

        $this->assertSame(1, $stock['summary']['total_products']);

        $low = $reports->lowStock($filters);
        $lowIds = collect($low['products'])->pluck('id');
        $this->assertFalse($lowIds->contains($formula->id));

        $valuationNames = collect($reports->valuation()['by_category'])->pluck('category');
        $this->assertNotEmpty($valuationNames);
        $this->assertNotEmpty($names);
    }

    public function test_formula_cannot_be_selected_as_an_ingredient(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);
        $formula = $this->product('Inner Formula', 'g', 0, 500);
        $ingredient = $this->product('Ginger', 'g', 500, 5);
        $this->formula($formula, $ingredient);

        $response = $this->actingAs($admin)
            ->getJson('/inventory/composition/components?search=Inner Formula')
            ->assertOk();

        $ids = collect($response->json('data'))->pluck('id');
        $this->assertFalse($ids->contains($formula->id));

        $plain = $this->product('Black Pepper', 'g', 500, 5);
        $ingredientIds = collect(
            $this->actingAs($admin)
                ->getJson('/inventory/composition/components?search='.urlencode($plain->name))
                ->assertOk()
                ->json('data')
        )->pluck('id');

        $this->assertTrue($ingredientIds->contains($plain->id));
    }

    public function test_inventory_list_exposes_formula_flags_and_ingredient_count(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);
        $formula = $this->product('Outer Formula', 'g', 0, 500);
        $ingredient = $this->product('Ashwagandha test', 'g', 500, 5);
        $this->formula($formula, $ingredient);

        $page = $this->actingAs($admin)
            ->get('/inventory?composition=formula')
            ->assertOk()
            ->viewData('page');

        $rows = collect($page['props']['products'])->keyBy('id');
        $this->assertTrue($rows->has($formula->id));
        $this->assertTrue((bool) $rows[$formula->id]['has_consumption_composition']);
        $this->assertSame(1, (int) $rows[$formula->id]['ingredient_count']);
        $this->assertNull($rows[$formula->id]['stock_value']);
    }

    public function test_purchase_picker_excludes_formula_products(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);
        $formula = $this->product('Purchasable Formula', 'g', 0, 500);
        $ingredient = $this->product('Purchasable Ingredient', 'g', 500, 5);
        $this->formula($formula, $ingredient);

        $page = $this->actingAs($admin)->get('/purchases/new')->assertOk()->viewData('page');
        $ids = collect($page['props']['products'])->pluck('id');

        $this->assertFalse($ids->contains($formula->id));
        $this->assertTrue($ids->contains($ingredient->id));
    }
}
