<?php

namespace Tests\Feature\Composition;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Composition\Services\CompositionReturnRecoveryService;
use App\Domains\Composition\Services\CompositionService;
use App\Domains\Production\Services\ProductionReportService;
use App\Domains\Reports\DTOs\ReportFilters;
use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\DTOs\SaleItemData;
use App\Domains\Sales\Services\SaleService;
use App\Models\CompositionRun;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\SaleItem;
use App\Models\SellingUnit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class FormulaRuntimeTest extends TestCase
{
    use RefreshDatabase;

    private function product(
        string $name,
        string $unit = 'piece',
        float $stock = 0,
        ?float $cost = null,
        float $price = 500,
    ): Product {
        $product = Product::create([
            'name' => $name.' '.uniqid(),
            'sku' => 'FR-'.uniqid(),
            'base_unit_id' => $unit,
            'track_inventory' => true,
            'stock_quantity' => $stock,
            'average_cost' => $cost,
            'status' => $stock > 0 ? 'in-stock' : 'out-of-stock',
            'allow_negative_stock' => false,
        ]);

        SellingUnit::create([
            'product_id' => $product->id,
            'name' => $unit === 'piece' ? 'Formula' : $unit,
            'unit_id' => $unit,
            'quantity' => 1,
            'sale_price' => $price,
            'is_default' => true,
        ]);

        return $product;
    }

    private function formula(Product $formula, Product $first, Product $second): ProductComposition
    {
        return app(CompositionService::class)->save(new SaveCompositionData(
            productId: $formula->id,
            kind: ProductComposition::KIND_CONSUMPTION,
            items: [
                new CompositionItemData(
                    componentProductId: $first->id,
                    quantityBase: 10,
                    displayUnitId: 'g',
                ),
                new CompositionItemData(
                    componentProductId: $second->id,
                    quantityBase: 5,
                    displayUnitId: 'g',
                ),
            ],
            name: 'Joint Pain Formula',
            outputQuantity: 1,
            outputUnitId: 'piece',
        ), 'tester');
    }

    /**
     * @param  array<int, array{composition_item_id: int, quantity: float, unit_id: string}>  $overrides
     */
    private function sale(Product $formula, float $quantity, array $overrides = []): void
    {
        app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-FR-'.uniqid(),
            customerId: 0,
            customerName: 'Walk-in',
            date: '2026-11-15',
            items: [SaleItemData::fromArray([
                'product_id' => $formula->id,
                'product_name' => $formula->name,
                'quantity' => $quantity,
                'base_unit_quantity' => 1,
                'base_quantity' => $quantity,
                'unit_price' => 500,
                'total' => 500 * $quantity,
                'formula_overrides' => $overrides,
            ])],
            discount: 0,
            amountPaid: 500 * $quantity,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'tester',
        ));
    }

    public function test_runtime_quantities_are_per_formula_unit_and_do_not_mutate_defaults(): void
    {
        $formula = $this->product('Joint Pain Formula');
        $first = $this->product('Ashwagandha', 'g', 100, 5);
        $second = $this->product('Turmeric', 'g', 100, 2);
        $composition = $this->formula($formula, $first, $second);
        $items = $composition->items()->orderBy('id')->get();

        $this->sale($formula, 2, [
            ['composition_item_id' => $items[0]->id, 'quantity' => 20, 'unit_id' => 'g'],
            ['composition_item_id' => $items[1]->id, 'quantity' => 10, 'unit_id' => 'g'],
        ]);

        $this->assertSame(60.0, (float) $first->fresh()->stock_quantity);
        $this->assertSame(80.0, (float) $second->fresh()->stock_quantity);

        $run = CompositionRun::with('items')->firstOrFail();
        $runItems = $run->items->keyBy('component_product_id');

        $this->assertSame(40.0, (float) $runItems[$first->id]->actual_quantity);
        $this->assertSame(20.0, (float) $runItems[$first->id]->template_quantity);
        $this->assertSame(20.0, (float) $runItems[$second->id]->actual_quantity);
        $this->assertTrue($runItems[$first->id]->source_breakdown[0]['overridden']);

        $this->assertSame(10.0, (float) $items[0]->fresh()->quantity_base);
        $this->assertSame(5.0, (float) $items[1]->fresh()->quantity_base);

        $saleItem = $run->saleItem()->firstOrFail();
        $this->assertSame(2.0, (float) $saleItem->base_quantity);
        $this->assertSame(120.0, (float) $saleItem->cost_price);
        $this->assertSame(1, $saleItem->sale()->firstOrFail()->items()->count());
    }

    public function test_default_quantities_are_used_when_no_customization_is_sent(): void
    {
        $formula = $this->product('Joint Pain Formula');
        $first = $this->product('Ashwagandha', 'g', 100, 5);
        $second = $this->product('Turmeric', 'g', 100, 2);
        $this->formula($formula, $first, $second);

        $this->sale($formula, 1);

        $this->assertSame(90.0, (float) $first->fresh()->stock_quantity);
        $this->assertSame(95.0, (float) $second->fresh()->stock_quantity);

        $run = CompositionRun::with('items')->firstOrFail();
        $this->assertSame(10.0, (float) $run->items->firstWhere('component_product_id', $first->id)->actual_quantity);
        $this->assertSame(5.0, (float) $run->items->firstWhere('component_product_id', $second->id)->actual_quantity);
    }

    public function test_historical_runtime_snapshot_survives_formula_edit(): void
    {
        $formula = $this->product('Joint Pain Formula');
        $first = $this->product('Ashwagandha', 'g', 100, 5);
        $second = $this->product('Turmeric', 'g', 100, 2);
        $composition = $this->formula($formula, $first, $second);
        $items = $composition->items()->orderBy('id')->get();

        $this->sale($formula, 1, [
            ['composition_item_id' => $items[0]->id, 'quantity' => 20, 'unit_id' => 'g'],
            ['composition_item_id' => $items[1]->id, 'quantity' => 10, 'unit_id' => 'g'],
        ]);

        $run = CompositionRun::with('items')->firstOrFail();
        $originalActual = (float) $run->items->firstWhere('component_product_id', $first->id)->actual_quantity;

        app(CompositionService::class)->update($composition, new SaveCompositionData(
            productId: $formula->id,
            kind: ProductComposition::KIND_CONSUMPTION,
            items: [
                new CompositionItemData(
                    componentProductId: $first->id,
                    quantityBase: 50,
                    displayUnitId: 'g',
                ),
                new CompositionItemData(
                    componentProductId: $second->id,
                    quantityBase: 5,
                    displayUnitId: 'g',
                ),
            ],
            name: 'Joint Pain Formula',
            outputQuantity: 1,
            outputUnitId: 'piece',
        ), 'tester');

        $this->assertSame(
            $originalActual,
            (float) $run->fresh('items')->items->firstWhere('component_product_id', $first->id)->actual_quantity,
        );
    }

    public function test_ingredient_usage_report_uses_actual_runtime_quantities(): void
    {
        $formula = $this->product('Joint Pain Formula');
        $first = $this->product('Ashwagandha', 'g', 100, 5);
        $second = $this->product('Turmeric', 'g', 100, 2);
        $composition = $this->formula($formula, $first, $second);
        $items = $composition->items()->orderBy('id')->get();

        $this->sale($formula, 2, [
            ['composition_item_id' => $items[0]->id, 'quantity' => 20, 'unit_id' => 'g'],
            ['composition_item_id' => $items[1]->id, 'quantity' => 10, 'unit_id' => 'g'],
        ]);

        $report = app(ProductionReportService::class)->componentUsage(
            new ReportFilters(dateFrom: '2026-11-15', dateTo: '2026-11-15'),
        );

        $posRows = collect($report['rows'])->where('source', 'pos');
        $this->assertCount(2, $posRows);
        $this->assertSame(60.0, (float) $report['summary']['pos_quantity']);
        $this->assertSame(40.0, (float) $posRows->firstWhere('component_product_id', $first->id)['actual_quantity']);

        $aggregate = collect($report['by_component'])->firstWhere('component_product_id', $first->id);
        $this->assertSame(40.0, (float) $aggregate['pos_quantity']);
    }

    public function test_return_recovery_uses_actual_customized_quantity(): void
    {
        $formula = $this->product('Joint Pain Formula');
        $first = $this->product('Ashwagandha', 'g', 100, 5);
        $second = $this->product('Turmeric', 'g', 100, 2);
        $composition = $this->formula($formula, $first, $second);
        $items = $composition->items()->orderBy('id')->get();

        $this->sale($formula, 1, [
            ['composition_item_id' => $items[0]->id, 'quantity' => 20, 'unit_id' => 'g'],
            ['composition_item_id' => $items[1]->id, 'quantity' => 10, 'unit_id' => 'g'],
        ]);

        $saleItem = SaleItem::where('product_id', $formula->id)->firstOrFail();
        $eligible = app(CompositionReturnRecoveryService::class)->eligibleLines($saleItem, 1);
        $line = collect($eligible)->firstWhere('component_product_id', $first->id);

        $this->assertNotNull($line);
        $this->assertSame(20.0, (float) $line['basis_quantity']);
        $this->assertSame(20.0, (float) $line['eligible_quantity']);
    }

    public function test_checkout_http_contract_accepts_runtime_formula_overrides(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);
        $formula = $this->product('Joint Pain Formula');
        $first = $this->product('Ashwagandha', 'g', 100, 5);
        $second = $this->product('Turmeric', 'g', 100, 2);
        $composition = $this->formula($formula, $first, $second);
        $items = $composition->items()->orderBy('id')->get();

        $response = $this->actingAs($admin)->post('/sales', [
            'invoice_number' => 'INV-FR-HTTP-'.uniqid(),
            'date' => '2026-11-15',
            'source' => 'pos',
            'items' => [[
                'product_id' => $formula->id,
                'quantity' => 2,
                'packaging_quantity' => 2,
                'selling_unit_id' => $formula->sellingUnits()->firstOrFail()->id,
                'unit_price' => 500,
                'total' => 1000,
                'formula_overrides' => [
                    ['composition_item_id' => $items[0]->id, 'quantity' => 20, 'unit_id' => 'g'],
                    ['composition_item_id' => $items[1]->id, 'quantity' => 10, 'unit_id' => 'g'],
                ],
            ]],
            'discount' => 0,
            'amount_paid' => 1000,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
        ]);

        $response->assertRedirect();
        $this->assertSame(60.0, (float) $first->fresh()->stock_quantity);
        $this->assertSame(80.0, (float) $second->fresh()->stock_quantity);
        $this->assertSame(40.0, (float) CompositionRun::firstOrFail()->items()
            ->where('component_product_id', $first->id)->value('actual_quantity'));
    }

    public function test_forged_ingredient_override_is_rejected_and_moves_no_stock(): void
    {
        $formula = $this->product('Joint Pain Formula');
        $first = $this->product('Ashwagandha', 'g', 100, 5);
        $second = $this->product('Turmeric', 'g', 100, 2);
        $this->formula($formula, $first, $second);

        $other = $this->product('Other Formula');
        $otherFirst = $this->product('Other ingredient', 'g', 100, 5);
        $otherComposition = $this->formula($other, $otherFirst, $second);
        $foreignItemId = $otherComposition->items()->orderBy('id')->value('id');

        try {
            $this->sale($formula, 1, [
                ['composition_item_id' => $foreignItemId, 'quantity' => 20, 'unit_id' => 'g'],
            ]);
            $this->fail('A foreign formula ingredient should have been rejected.');
        } catch (ValidationException) {
            // Expected.
        }

        $this->assertSame(100.0, (float) $first->fresh()->stock_quantity);
        $this->assertSame(100.0, (float) $second->fresh()->stock_quantity);
        $this->assertSame(0, CompositionRun::count());
    }
}
