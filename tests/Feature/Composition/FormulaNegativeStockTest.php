<?php

namespace Tests\Feature\Composition;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Composition\Exceptions\InsufficientComponentStockException;
use App\Domains\Composition\Services\CompositionService;
use App\Domains\Inventory\Services\InventoryService;
use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\DTOs\SaleItemData;
use App\Domains\Sales\Services\SaleService;
use App\Domains\Settings\Services\SettingService;
use App\Models\CompositionRun;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\Sale;
use App\Models\SellingUnit;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * P13: a formula ingredient must follow the same negative-stock policy as a
 * product sold directly. When negative stock is permitted the sale proceeds and
 * the ingredient balance goes negative; when it is forbidden the sale is
 * rejected and nothing moves.
 */
class FormulaNegativeStockTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'active' => true]);
    }

    private function product(
        string $name,
        string $unit = 'g',
        float $stock = 0,
        ?bool $allowNegativeStock = false,
        float $price = 500,
    ): Product {
        $product = Product::create([
            'name' => $name.' '.uniqid(),
            'sku' => 'P13-'.uniqid(),
            'base_unit_id' => $unit,
            'track_inventory' => true,
            'stock_quantity' => $stock,
            'status' => $stock > 0 ? 'in-stock' : 'out-of-stock',
            'allow_negative_stock' => $allowNegativeStock,
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

    /**
     * @param  array<int, array{0: Product, 1: float}>  $ingredients
     */
    private function formula(Product $formula, array $ingredients): ProductComposition
    {
        return app(CompositionService::class)->save(new SaveCompositionData(
            productId: $formula->id,
            kind: ProductComposition::KIND_CONSUMPTION,
            items: array_map(fn (array $pair) => new CompositionItemData(
                componentProductId: $pair[0]->id,
                quantityBase: $pair[1],
                displayUnitId: $pair[0]->base_unit_id,
            ), $ingredients),
            name: 'P13 Formula',
            outputQuantity: 1,
            outputUnitId: $formula->base_unit_id,
        ), 'tester');
    }

    private function sell(Product $formula, float $quantity, float $unitPrice = 500): Sale
    {
        return app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-P13-'.uniqid(),
            customerId: 0,
            customerName: 'Walk-in',
            date: '2026-11-15',
            items: [new SaleItemData($formula->id, $formula->name, $quantity, 1, $quantity, $unitPrice, $quantity * $unitPrice, $formula->base_unit_id, 0, 'General')],
            discount: 0,
            amountPaid: $quantity * $unitPrice,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'tester',
        ));
    }

    public function test_negative_stock_enabled_allows_formula_sale_and_goes_negative(): void
    {
        $formula = $this->product('Formula');
        $ingredient = $this->product('P', 'g', 1, allowNegativeStock: true);
        $this->formula($formula, [[$ingredient, 5]]);

        // 3 formulas x 5g = 15g required against 1g on hand.
        $sale = $this->sell($formula, 3);

        $this->assertNotNull($sale->id);
        $this->assertSame(-14.0, round((float) $ingredient->fresh()->stock_quantity, 6));
    }

    public function test_negative_stock_enabled_deducts_every_short_ingredient(): void
    {
        $formula = $this->product('Multi');
        $first = $this->product('First', 'g', 1, allowNegativeStock: true);
        $second = $this->product('Second', 'g', 2, allowNegativeStock: true);
        $third = $this->product('Third', 'g', 100, allowNegativeStock: true);
        $this->formula($formula, [[$first, 5], [$second, 4], [$third, 2]]);

        $this->sell($formula, 2);

        $this->assertSame(-9.0, round((float) $first->fresh()->stock_quantity, 6));
        $this->assertSame(-6.0, round((float) $second->fresh()->stock_quantity, 6));
        $this->assertSame(96.0, round((float) $third->fresh()->stock_quantity, 6));
    }

    public function test_negative_stock_disabled_still_rejects_formula_sale(): void
    {
        $formula = $this->product('Blocked');
        $ingredient = $this->product('Scarce', 'g', 1, allowNegativeStock: false);
        $this->formula($formula, [[$ingredient, 5]]);

        try {
            $this->sell($formula, 3);
            $this->fail('A shortage must still be rejected when negative stock is off.');
        } catch (InsufficientComponentStockException $exception) {
            $this->assertSame(15.0, $exception->requiredQuantity);
            $this->assertSame(1.0, $exception->availableQuantity);
        }

        $this->assertSame(1.0, (float) $ingredient->fresh()->stock_quantity);
        $this->assertSame(0, CompositionRun::count());
        $this->assertSame(0, InventoryTransaction::count());
    }

    public function test_business_setting_applies_when_the_product_has_no_override(): void
    {
        // A null product override means "follow the business setting". Enable it
        // at the business level and the ingredient must be allowed to go negative.
        $defaults = app(SettingService::class)->defaults();
        $defaults['inventory']['allow_negative_stock'] = true;
        Setting::create(['values' => $defaults]);
        Cache::forget('app_settings');

        $formula = $this->product('Inherits');
        $ingredient = $this->product('Inheriting', 'g', 1, allowNegativeStock: null);
        $this->formula($formula, [[$ingredient, 5]]);

        $this->sell($formula, 3);

        $this->assertSame(-14.0, round((float) $ingredient->fresh()->stock_quantity, 6));
    }

    public function test_business_setting_blocking_applies_when_the_product_has_no_override(): void
    {
        // The business default forbids negative stock, so a null product override
        // must fall back to blocking rather than allowing.
        $this->freshSettings();

        $formula = $this->product('Inherits Off');
        $ingredient = $this->product('Inheriting Off', 'g', 1, allowNegativeStock: null);
        $this->formula($formula, [[$ingredient, 5]]);

        $this->expectException(InsufficientComponentStockException::class);
        $this->sell($formula, 3);
    }

    private function freshSettings(): void
    {
        Setting::query()->delete();
        Cache::forget('app_settings');
    }

    public function test_sufficient_stock_behaves_normally(): void
    {
        $formula = $this->product('Plenty');
        $ingredient = $this->product('Stocked', 'g', 100, allowNegativeStock: true);
        $this->formula($formula, [[$ingredient, 5]]);

        $this->sell($formula, 2);

        $this->assertSame(90.0, round((float) $ingredient->fresh()->stock_quantity, 6));
    }

    public function test_formula_itself_never_holds_stock_even_when_negative_is_allowed(): void
    {
        $formula = $this->product('Parent', 'g', 0, allowNegativeStock: true);
        $ingredient = $this->product('Child', 'g', 1, allowNegativeStock: true);
        $this->formula($formula, [[$ingredient, 5]]);

        $this->sell($formula, 3);

        $this->assertSame(0.0, (float) $formula->fresh()->stock_quantity);
        $this->assertSame(0, InventoryTransaction::where('product_id', $formula->id)->count());
    }

    public function test_consumption_scales_with_formula_quantity(): void
    {
        $formula = $this->product('Scaled');
        $ingredient = $this->product('Scaled Ingredient', 'g', 100, allowNegativeStock: true);
        $this->formula($formula, [[$ingredient, 10]]);

        $this->sell($formula, 4);

        // 4 x 10g = 40g consumed.
        $this->assertSame(60.0, round((float) $ingredient->fresh()->stock_quantity, 6));
        $this->assertSame(
            -40.0,
            round((float) InventoryTransaction::where('product_id', $ingredient->id)
                ->where('type', 'consumption')->sum('quantity'), 6),
        );
    }

    public function test_ledger_records_the_actual_consumption(): void
    {
        $formula = $this->product('Ledger');
        $ingredient = $this->product('Ledger Ingredient', 'g', 1, allowNegativeStock: true);
        $this->formula($formula, [[$ingredient, 5]]);

        $this->sell($formula, 3);

        $movement = InventoryTransaction::where('product_id', $ingredient->id)
            ->where('type', 'consumption')->firstOrFail();

        $this->assertSame(-15.0, round((float) $movement->quantity, 6));
        // Stored balance (opening 1 - 15) must equal the signed ledger total.
        $this->assertSame(-14.0, round((float) $ingredient->fresh()->stock_quantity, 6));
        $this->assertSame(
            round((float) $ingredient->fresh()->stock_quantity - 1.0, 6),
            round((float) InventoryTransaction::where('product_id', $ingredient->id)->sum('quantity'), 6),
        );
    }

    public function test_traditional_product_negative_stock_behavior_is_unchanged(): void
    {
        $allowed = $this->product('Allowed', 'piece', 1, allowNegativeStock: true);
        $blocked = $this->product('Blocked Product', 'piece', 1, allowNegativeStock: false);

        app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-P13-T1-'.uniqid(),
            customerId: 0,
            customerName: 'Walk-in',
            date: '2026-11-15',
            items: [new SaleItemData($allowed->id, 'Allowed', 3, 1, 3, 500, 1500, 'piece', 0, 'General')],
            discount: 0,
            amountPaid: 1500,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'tester',
        ));

        $this->assertSame(-2.0, round((float) $allowed->fresh()->stock_quantity, 6));

        try {
            app(SaleService::class)->create(new CreateSaleData(
                invoiceNumber: 'INV-P13-T2-'.uniqid(),
                customerId: 0,
                customerName: 'Walk-in',
                date: '2026-11-15',
                items: [new SaleItemData($blocked->id, 'Blocked Product', 3, 1, 3, 500, 1500, 'piece', 0, 'General')],
                discount: 0,
                amountPaid: 1500,
                paymentMethod: 'cash',
                paymentStatus: 'paid',
                source: 'pos',
                notes: null,
                createdBy: 'tester',
            ));
            $this->fail('A blocked product must still reject.');
        } catch (\InvalidArgumentException) {
            $this->assertSame(1.0, round((float) $blocked->fresh()->stock_quantity, 6));
        }
    }

    public function test_snapshot_records_actual_quantity_even_when_stock_goes_negative(): void
    {
        $formula = $this->product('Snapshot');
        $ingredient = $this->product('Snapshot Ingredient', 'g', 1, allowNegativeStock: true);
        $this->formula($formula, [[$ingredient, 5]]);

        $this->sell($formula, 3);

        $snapshot = CompositionRun::firstOrFail()->items()
            ->where('component_product_id', $ingredient->id)->firstOrFail();

        // The snapshot stores what was consumed, not what was available.
        $this->assertSame(15.0, round((float) $snapshot->actual_quantity, 6));
        $this->assertSame(-14.0, round((float) $ingredient->fresh()->stock_quantity, 6));
    }

    public function test_policy_resolver_is_the_single_source(): void
    {
        $inventory = app(InventoryService::class);

        $explicitOn = $this->product('Explicit On', 'g', 0, allowNegativeStock: true);
        $explicitOff = $this->product('Explicit Off', 'g', 0, allowNegativeStock: false);
        $inherits = $this->product('Inherits Setting', 'g', 0, allowNegativeStock: null);

        $this->assertTrue($inventory->allowsNegativeStock($explicitOn));
        $this->assertFalse($inventory->allowsNegativeStock($explicitOff));
        // The shipped business default forbids negative stock.
        $this->freshSettings();
        $this->assertFalse($inventory->allowsNegativeStock($inherits));
    }
}
