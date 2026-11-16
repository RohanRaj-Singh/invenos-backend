<?php

namespace Tests\Feature\Sales;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Composition\Services\CompositionService;
use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\DTOs\SaleItemData;
use App\Domains\Sales\Services\SaleService;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\Sale;
use App\Models\SellingUnit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

/**
 * The selling unit a line names must belong to that line's product, for every
 * kind of product. A stale id must fail with a message the user can act on.
 */
class SaleSellingUnitIntegrityTest extends TestCase
{
    use RefreshDatabase;

    private function product(string $name, string $baseUnit = 'piece', float $stock = 0): Product
    {
        return Product::create([
            'name' => $name,
            'sku' => 'SU-'.uniqid(),
            'base_unit_id' => $baseUnit,
            'track_inventory' => true,
            'stock_quantity' => $stock,
        ]);
    }

    private function sellingUnit(Product $product, float $quantity = 1, float $price = 100): SellingUnit
    {
        return SellingUnit::create([
            'product_id' => $product->id,
            'name' => 'Unit',
            'unit_id' => $product->base_unit_id,
            'quantity' => $quantity,
            'sale_price' => $price,
            'is_default' => true,
        ]);
    }

    private function formula(): Product
    {
        $formula = $this->product('24 number nuskha');
        $this->sellingUnit($formula, 1, 500);

        $ingredient = $this->product('Ingredient', 'g', 100);
        $ingredient->average_cost = 1;
        $ingredient->save();

        app(CompositionService::class)->save(new SaveCompositionData(
            productId: $formula->id,
            kind: ProductComposition::KIND_CONSUMPTION,
            items: [new CompositionItemData($ingredient->id, 10, 'g')],
            name: 'nuskha',
            outputQuantity: 1,
            outputUnitId: 'piece',
        ), 'tester');

        return $formula;
    }

    private function sale(Product $product, ?int $sellingUnitId, float $packagingQuantity = 1, float $baseUnitQuantity = 1, ?int $compositionId = null): Sale
    {
        return app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-'.uniqid(),
            customerId: 0,
            customerName: 'Walk-in',
            date: now()->format('Y-m-d'),
            items: [new SaleItemData(
                productId: $product->id,
                productName: $product->name,
                packagingQuantity: $packagingQuantity,
                baseUnitQuantity: $baseUnitQuantity,
                baseQuantity: $packagingQuantity * $baseUnitQuantity,
                unitPrice: 100,
                total: 100 * $packagingQuantity,
                packagingName: 'Unit',
                discountPct: 0,
                category: 'General',
                sellingUnitId: $sellingUnitId,
                formulaCompositionId: $compositionId,
            )],
            discount: 0,
            amountPaid: 100 * $packagingQuantity,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'tester',
        ));
    }

    public function test_formula_sells_with_its_own_selling_unit(): void
    {
        $formula = $this->formula();
        $unit = $formula->sellingUnits()->firstOrFail();

        $this->sale($formula, $unit->id, 1, 1, $formula->compositions()->firstOrFail()->id);

        $this->assertSame(1, Sale::count());
    }

    public function test_formula_rejects_another_products_selling_unit_with_an_actionable_message(): void
    {
        $formula = $this->formula();
        $other = $this->product('Other');
        $foreignUnit = $this->sellingUnit($other);

        try {
            $this->sale($formula, $foreignUnit->id, 1, 1, $formula->compositions()->firstOrFail()->id);
            $this->fail('Expected the sale to be rejected.');
        } catch (ValidationException $exception) {
            $this->assertSame(
                "The price unit for '24 number nuskha' is out of date. Remove this line and add the product again.",
                $exception->errors()['items'][0],
            );
        }

        $this->assertSame(0, Sale::count());
    }

    public function test_formula_rejects_a_selling_unit_that_no_longer_exists(): void
    {
        $formula = $this->formula();
        $unit = $formula->sellingUnits()->firstOrFail();
        $id = $unit->id;
        $unit->delete();

        try {
            $this->sale($formula, $id, 1, 1, $formula->compositions()->firstOrFail()->id);
            $this->fail('Expected the sale to be rejected.');
        } catch (ValidationException $exception) {
            $this->assertStringContainsString('is out of date', $exception->errors()['items'][0]);
        }

        $this->assertSame(0, Sale::count());
    }

    public function test_formula_sells_without_a_selling_unit(): void
    {
        $formula = $this->formula();
        $composition = $formula->compositions()->firstOrFail();

        $this->sale($formula, null, 1, 1, $composition->id);

        $this->assertSame(1, Sale::count());
    }

    /**
     * Previously a physical product silently fell back to the client-supplied
     * base quantity when the unit id did not belong to it. The rule is now the
     * same as for formulas.
     */
    public function test_physical_product_rejects_another_products_selling_unit(): void
    {
        $physical = $this->product('Sold by piece', 'piece', 10);
        $this->sellingUnit($physical);

        $other = $this->product('Other');
        $foreignUnit = $this->sellingUnit($other);

        $this->expectException(ValidationException::class);

        try {
            $this->sale($physical, $foreignUnit->id);
        } finally {
            $this->assertSame(0, Sale::count());
        }
    }

    public function test_physical_product_uses_the_stored_conversion_factor(): void
    {
        $physical = $this->product('Sold by strip', 'piece', 100);
        $pack = $this->sellingUnit($physical, 10, 100);

        $sale = $this->sale($physical, $pack->id, 1, 1);

        // 1 pack x 10 base units, not the client's 1.
        $this->assertSame(10.0, (float) $sale->items()->firstOrFail()->base_quantity);
        $this->assertSame(90.0, (float) $physical->fresh()->stock_quantity);
    }

    public function test_physical_product_without_a_selling_unit_still_sells(): void
    {
        $physical = $this->product('Loose item', 'piece', 10);

        $sale = $this->sale($physical, null, 2, 1);

        $this->assertSame(2.0, (float) $sale->items()->firstOrFail()->base_quantity);
        $this->assertSame(8.0, (float) $physical->fresh()->stock_quantity);
    }
}
