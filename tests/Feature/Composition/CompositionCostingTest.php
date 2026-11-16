<?php

namespace Tests\Feature\Composition;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Composition\Services\CompositionService;
use App\Domains\Reports\DTOs\ReportFilters;
use App\Domains\Reports\Services\CogsCalculator;
use App\Domains\Reports\Services\DayBookReportService;
use App\Domains\Reports\Services\FinancialReportService;
use App\Domains\Reports\Services\SalesReportService;
use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\DTOs\SaleItemData;
use App\Domains\Sales\Services\SaleService;
use App\Models\CompositionRun;
use App\Models\CompositionRunItem;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\Sale;
use App\Models\SellingUnit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompositionCostingTest extends TestCase
{
    use RefreshDatabase;

    private function product(
        string $name,
        string $unit = 'piece',
        float $stock = 100,
        ?float $averageCost = null,
        float $price = 100,
        ?float $defaultPurchaseCost = null,
    ): Product {
        $product = Product::create([
            'name' => $name.' '.uniqid(),
            'sku' => 'P5-'.uniqid(),
            'base_unit_id' => $unit,
            'track_inventory' => true,
            'stock_quantity' => $stock,
            'status' => $stock > 0 ? 'in-stock' : 'out-of-stock',
            'allow_negative_stock' => false,
            'average_cost' => $averageCost,
            'default_purchase_cost' => $defaultPurchaseCost,
        ]);

        SellingUnit::create([
            'product_id' => $product->id,
            'name' => 'Single',
            'unit_id' => $unit,
            'quantity' => 1,
            'sale_price' => $price,
            'is_default' => true,
        ]);

        return $product;
    }

    private function item(Product $component, float $quantity, float $wastage = 0): CompositionItemData
    {
        return new CompositionItemData(
            componentProductId: $component->id,
            quantityBase: $quantity,
            displayUnitId: $component->base_unit_id,
            wastagePct: $wastage,
        );
    }

    /**
     * @param  CompositionItemData[]  $items
     */
    private function composition(
        Product $parent,
        array $items,
        string $kind = ProductComposition::KIND_CONSUMPTION,
    ): ProductComposition {
        return app(CompositionService::class)->save(new SaveCompositionData(
            productId: $parent->id,
            kind: $kind,
            items: $items,
            name: 'P5 formula',
            outputQuantity: 1,
            outputUnitId: $parent->base_unit_id,
        ), 'tester');
    }

    /**
     * @param  array<int, array{product: Product, quantity: float, unit_price?: float}>  $lines
     */
    private function createSale(array $lines, ?string $idempotencyKey = null, string $date = '2026-11-15'): Sale
    {
        $items = array_map(function (array $line) {
            $product = $line['product'];
            $sellingUnit = $product->sellingUnits()->first();
            $quantity = (float) $line['quantity'];
            $unitPrice = (float) ($line['unit_price'] ?? $sellingUnit->sale_price);

            return SaleItemData::fromArray([
                'product_id' => $product->id,
                'product_name' => $product->name,
                'quantity' => $quantity,
                'base_unit_quantity' => $sellingUnit->quantity,
                'base_quantity' => $quantity * $sellingUnit->quantity,
                'unit_price' => $unitPrice,
                'total' => $quantity * $unitPrice,
            ]);
        }, $lines);

        $total = array_sum(array_map(fn (SaleItemData $item) => $item->total, $items));

        return app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-P5-'.uniqid(),
            customerId: 0,
            customerName: 'Walk-in',
            date: $date,
            items: $items,
            discount: 0,
            amountPaid: $total,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'tester',
            idempotencyKey: $idempotencyKey,
        ));
    }

    private function filters(string $date = '2026-11-15'): ReportFilters
    {
        return new ReportFilters(dateFrom: $date, dateTo: $date);
    }

    public function test_consumption_sale_rolls_component_cost_into_sale_item_and_canonical_cogs(): void
    {
        $service = $this->product('Service', 'piece', 10, price: 1000);
        $first = $this->product('Component A', 'ml', 100, 2.5);
        $second = $this->product('Component B', 'ml', 100, 10);
        $this->composition($service, [
            $this->item($first, 5),
            $this->item($second, 2),
        ]);

        $sale = $this->createSale([
            ['product' => $service, 'quantity' => 2, 'unit_price' => 1000],
        ]);

        $saleItem = $sale->items()->firstOrFail();
        $run = CompositionRun::with('items')->firstOrFail();
        $cogs = app(CogsCalculator::class)->summary('2026-11-15', '2026-11-15');
        $line = app(CogsCalculator::class)->lineCostsForSaleItemIds([$saleItem->id])[$saleItem->id];

        // (5 ml x 2.50 x 2) + (2 ml x 10.00 x 2) = 25 + 40 = 65.
        $this->assertSame(65.0, $run->total_cost);
        $this->assertSame(32.5, $saleItem->cost_price);
        $this->assertSame(32.5, $line['unit_cost']);
        $this->assertSame(65.0, $line['total_cost']);
        $this->assertTrue($line['cost_complete']);
        $this->assertSame('exact', $cogs['composition_cost_basis']);
        $this->assertSame(65.0, $cogs['cogs']);
        $this->assertSame(65.0, $cogs['composition_cogs']);
        $this->assertSame(0.0, $cogs['simple_cogs']);
        $this->assertTrue($cogs['cost_complete']);
        $this->assertSame(0, $cogs['uncosted_composition_items']);

        $profit = app(SalesReportService::class)->profit($this->filters());
        $this->assertSame(65.0, (float) $profit['cogs']);
        $this->assertSame(1935.0, (float) $profit['gross_profit']);
        $this->assertTrue($profit['cost_complete']);
        $this->assertSame(65.0, (float) $profit['bill_wise'][0]['cogs']);
        $this->assertTrue($profit['bill_wise'][0]['cost_complete']);

        $dayBook = app(DayBookReportService::class)->generate($this->filters())['summary'];
        $this->assertSame(65.0, (float) $dayBook['cogs']);
        $this->assertTrue($dayBook['cost_complete']);

        $overview = app(FinancialReportService::class)->overview($this->filters())['summary'];
        $this->assertSame(1935.0, (float) $overview['gross_profit']);
        $this->assertTrue($overview['cost_complete']);
    }

    public function test_simple_product_cogs_is_unchanged(): void
    {
        $simple = $this->product('Simple', 'piece', 100, 8, 20);
        $sale = $this->createSale([
            ['product' => $simple, 'quantity' => 10, 'unit_price' => 20],
        ]);

        $saleItem = $sale->items()->firstOrFail();
        $cogs = app(CogsCalculator::class)->summary('2026-11-15', '2026-11-15');

        $this->assertSame(8.0, $saleItem->cost_price);
        $this->assertSame(80.0, $cogs['cogs']);
        $this->assertSame(80.0, $cogs['simple_cogs']);
        $this->assertSame(0.0, $cogs['composition_cogs']);
        $this->assertSame('none', $cogs['composition_cost_basis']);
        $this->assertSame(0, CompositionRun::count());
    }

    public function test_multiple_composition_lines_do_not_double_count_parent_or_components(): void
    {
        $firstService = $this->product('Service A', 'piece', 10, 100, 500);
        $secondService = $this->product('Service B', 'piece', 10, 100, 700);
        $firstComponent = $this->product('Component A', 'ml', 100, 5);
        $secondComponent = $this->product('Component B', 'ml', 100, 7);
        $this->composition($firstService, [$this->item($firstComponent, 1)]);
        $this->composition($secondService, [$this->item($secondComponent, 1)]);

        $sale = $this->createSale([
            ['product' => $firstService, 'quantity' => 1, 'unit_price' => 500],
            ['product' => $secondService, 'quantity' => 1, 'unit_price' => 700],
        ]);

        $cogs = app(CogsCalculator::class)->summary('2026-11-15', '2026-11-15');
        $profit = app(SalesReportService::class)->profit($this->filters());

        $this->assertSame(12.0, $cogs['cogs']);
        $this->assertSame(12.0, $cogs['composition_cogs']);
        $this->assertSame(2, $cogs['composition_item_count']);
        $this->assertSame(12.0, (float) collect($profit['bill_wise'])->sum('cogs'));
        $this->assertSame(12.0, (float) $profit['cogs']);
    }

    public function test_nested_composition_cost_is_not_double_counted(): void
    {
        $service = $this->product('Service', 'piece', 10, 100, 1000);
        $nestedService = $this->product('Nested service', 'piece', 10, 100);
        $raw = $this->product('Raw material', 'ml', 100, 2);
        $this->composition($nestedService, [$this->item($raw, 5)]);
        $this->composition($service, [$this->item($nestedService, 1)]);

        $this->createSale([['product' => $service, 'quantity' => 2, 'unit_price' => 1000]]);

        $cogs = app(CogsCalculator::class)->summary('2026-11-15', '2026-11-15');

        $this->assertSame(20.0, $cogs['cogs']);
        $this->assertSame(20.0, $cogs['composition_cogs']);
        $this->assertSame(1, $cogs['composition_item_count']);
    }

    public function test_partial_and_unavailable_costs_are_flagged_not_fabricated(): void
    {
        $service = $this->product('Service', 'piece', 10, price: 1000);
        $known = $this->product('Known component', 'ml', 100, 10);
        $unknown = $this->product('Unknown component', 'ml', 100);
        $this->composition($service, [
            $this->item($known, 1),
            $this->item($unknown, 1),
        ]);

        $sale = $this->createSale([['product' => $service, 'quantity' => 1, 'unit_price' => 1000]]);
        $saleItem = $sale->items()->firstOrFail();

        $cogs = app(CogsCalculator::class)->summary('2026-11-15', '2026-11-15');
        $line = app(CogsCalculator::class)->lineCostsForSaleItemIds([$saleItem->id])[$saleItem->id];

        $this->assertNull($saleItem->cost_price);
        $this->assertFalse($line['cost_complete']);
        $this->assertSame('partial', $line['cost_basis']);
        $this->assertSame(10.0, $line['total_cost']);
        $this->assertSame(1, $line['uncosted_lines']);
        $this->assertFalse($cogs['cost_complete']);
        $this->assertSame(1, $cogs['uncosted_composition_items']);
        $this->assertSame(1, $cogs['uncosted_composition_lines']);
        $this->assertSame('partial', $cogs['composition_cost_basis']);
        $this->assertSame(10.0, $cogs['cogs']);

        $profit = app(SalesReportService::class)->profit($this->filters());
        $this->assertFalse($profit['cost_complete']);
        $this->assertSame(10.0, (float) $profit['cogs']);
        $this->assertFalse($profit['bill_wise'][0]['cost_complete']);

        $dayBook = app(DayBookReportService::class)->generate($this->filters());
        $this->assertFalse($dayBook['summary']['cost_complete']);
        $this->assertTrue(collect($dayBook['health']['warnings'])->contains(
            fn (array $warning) => str_contains($warning['message'], 'cost is incomplete')
        ));

        $balance = app(FinancialReportService::class)->balanceSheet($this->filters());
        $this->assertFalse($balance['totals']['cost_complete']);
        $this->assertSame(1, $balance['totals']['uncosted_composition_lines']);
    }

    public function test_fully_unavailable_composition_cost_is_marked_incomplete(): void
    {
        $service = $this->product('Service', 'piece', 10, price: 1000);
        $unknown = $this->product('Unknown component', 'ml', 100);
        $this->composition($service, [$this->item($unknown, 1)]);

        $sale = $this->createSale([['product' => $service, 'quantity' => 1, 'unit_price' => 1000]]);

        $cogs = app(CogsCalculator::class)->summary('2026-11-15', '2026-11-15');

        $this->assertNull($sale->items()->firstOrFail()->cost_price);
        $this->assertFalse($cogs['cost_complete']);
        $this->assertSame('unavailable', $cogs['composition_cost_basis']);
        $this->assertSame(0.0, $cogs['cogs']);
        $this->assertSame(1, $cogs['uncosted_composition_lines']);
    }

    public function test_estimated_cost_basis_is_preserved(): void
    {
        $service = $this->product('Service', 'piece', 10, price: 1000);
        $estimated = $this->product('Estimated component', 'ml', 100, defaultPurchaseCost: 4);
        $this->composition($service, [$this->item($estimated, 2)]);

        $this->createSale([['product' => $service, 'quantity' => 1, 'unit_price' => 1000]]);

        $cogs = app(CogsCalculator::class)->summary('2026-11-15', '2026-11-15');

        $this->assertTrue($cogs['cost_complete']);
        $this->assertSame('estimated', $cogs['composition_cost_basis']);
        $this->assertSame(8.0, $cogs['cogs']);
    }

    public function test_historical_cost_survives_component_cost_template_and_archive_changes(): void
    {
        $service = $this->product('Service', 'piece', 10, price: 1000);
        $component = $this->product('Component', 'ml', 100, 2.5);
        $composition = $this->composition($service, [$this->item($component, 4)]);

        $sale = $this->createSale([['product' => $service, 'quantity' => 2, 'unit_price' => 1000]]);
        $saleItem = $sale->items()->firstOrFail();
        $run = CompositionRun::with('items')->firstOrFail();
        $originalCost = app(CogsCalculator::class)->summary('2026-11-15', '2026-11-15')['cogs'];

        $component->update(['average_cost' => 999]);
        app(CompositionService::class)->save(new SaveCompositionData(
            productId: $service->id,
            kind: ProductComposition::KIND_CONSUMPTION,
            items: [$this->item($component, 20)],
            name: 'Changed formula',
            outputQuantity: 1,
            outputUnitId: $service->base_unit_id,
        ), 'tester');
        $component->update(['archived_at' => now()]);

        $this->assertSame(20.0, (float) $originalCost);
        $this->assertSame($originalCost, app(CogsCalculator::class)->summary('2026-11-15', '2026-11-15')['cogs']);
        $this->assertSame(10.0, (float) $saleItem->fresh()->cost_price);
        $this->assertSame(2.5, (float) $run->fresh()->items->first()->unit_cost);
        $this->assertSame(8.0, (float) $run->items->first()->actual_quantity);
        $this->assertSame($composition->id, $run->composition_id);
    }

    public function test_sale_retry_does_not_duplicate_cogs_or_runs(): void
    {
        $service = $this->product('Service', 'piece', 10, price: 1000);
        $component = $this->product('Component', 'ml', 100, 5);
        $this->composition($service, [$this->item($component, 2)]);

        $key = 'p5-retry-'.uniqid();
        $sale = $this->createSale([['product' => $service, 'quantity' => 1, 'unit_price' => 1000]], $key);
        $this->createSale([['product' => $service, 'quantity' => 1, 'unit_price' => 1000]], $key);

        $cogs = app(CogsCalculator::class)->summary('2026-11-15', '2026-11-15');

        $this->assertSame(1, Sale::count());
        $this->assertSame(1, CompositionRun::count());
        $this->assertSame(10.0, $cogs['cogs']);
        $this->assertSame($sale->id, Sale::firstOrFail()->id);
    }

    public function test_multiple_runs_for_one_sale_item_aggregate_without_double_counting(): void
    {
        $service = $this->product('Service', 'piece', 10, price: 1000);
        $component = $this->product('Component', 'ml', 100, 5);
        $composition = $this->composition($service, [$this->item($component, 2)]);
        $sale = $this->createSale([['product' => $service, 'quantity' => 1, 'unit_price' => 1000]]);
        $saleItem = $sale->items()->firstOrFail();

        $extra = CompositionRun::create([
            'run_number' => 'RUN-'.uniqid(),
            'composition_id' => $composition->id,
            'product_id' => $service->id,
            'kind' => ProductComposition::KIND_CONSUMPTION,
            'source_type' => 'sale',
            'source_id' => $sale->id,
            'sale_item_id' => $saleItem->id,
            'template_version' => $composition->version,
            'quantity' => 1,
            'status' => CompositionRun::STATUS_COMPLETED,
        ]);
        CompositionRunItem::create([
            'composition_run_id' => $extra->id,
            'component_product_id' => $component->id,
            'component_name' => $component->name,
            'unit' => 'ml',
            'template_quantity' => 1,
            'actual_quantity' => 1,
            'unit_cost' => 5,
            'total_cost' => 5,
            'cost_basis' => 'exact',
            'source_breakdown' => [],
        ]);

        $cogs = app(CogsCalculator::class)->summary('2026-11-15', '2026-11-15');

        // First run consumed 2 x 5 = 10; extra run 1 x 5 = 5.
        $this->assertSame(15.0, $cogs['cogs']);
        $this->assertSame(15.0, $cogs['composition_cogs']);
        $this->assertSame(1, $cogs['composition_item_count']);
        $this->assertSame(2, CompositionRunItem::whereIn('composition_run_id', CompositionRun::pluck('id'))->count());
    }

    public function test_cogs_calculation_does_not_create_inventory_movements(): void
    {
        $service = $this->product('Service', 'piece', 10, price: 1000);
        $component = $this->product('Component', 'ml', 100, 5);
        $this->composition($service, [$this->item($component, 2)]);
        $this->createSale([['product' => $service, 'quantity' => 1, 'unit_price' => 1000]]);

        $before = InventoryTransaction::count();
        app(CogsCalculator::class)->summary('2026-11-15', '2026-11-15');
        app(SalesReportService::class)->profit($this->filters());
        app(FinancialReportService::class)->overview($this->filters());
        app(DayBookReportService::class)->generate($this->filters());

        $this->assertSame($before, InventoryTransaction::count());
    }

    public function test_composition_cogs_use_six_decimal_unit_cost_precision(): void
    {
        $service = $this->product('Service', 'piece', 10, price: 100);
        $component = $this->product('Fractional component', 'ml', 100, 1);
        $this->composition($service, [$this->item($component, 0.333333)]);

        $sale = $this->createSale([['product' => $service, 'quantity' => 1, 'unit_price' => 100]]);
        $cogs = app(CogsCalculator::class)->summary('2026-11-15', '2026-11-15');

        $this->assertSame(0.333333, (float) $sale->items()->firstOrFail()->cost_price);
        $this->assertSame(0.333333, (float) $cogs['cogs']);
        $this->assertSame(0.333333, (float) app(CogsCalculator::class)->lineCostsForSaleItemIds([$sale->items()->firstOrFail()->id])[$sale->items()->firstOrFail()->id]['unit_cost']);
    }
}
