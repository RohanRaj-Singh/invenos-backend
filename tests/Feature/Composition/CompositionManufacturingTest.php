<?php

namespace Tests\Feature\Composition;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Composition\Services\CompositionService;
use App\Domains\Production\Services\ProductionReportService;
use App\Domains\Production\Services\ProductionService;
use App\Domains\Reports\DTOs\ReportFilters;
use App\Domains\Reports\Services\CogsCalculator;
use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\DTOs\SaleItemData;
use App\Domains\Sales\Services\SaleService;
use App\Models\CompositionRun;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\ProductionOrder;
use App\Models\Sale;
use App\Models\SellingUnit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class CompositionManufacturingTest extends TestCase
{
    use RefreshDatabase;

    private function product(
        string $name,
        string $unit = 'piece',
        float $stock = 0,
        ?float $averageCost = null,
        float $price = 100,
    ): Product {
        $product = Product::create([
            'name' => $name.' '.uniqid(),
            'sku' => 'MFG-'.uniqid(),
            'base_unit_id' => $unit,
            'track_inventory' => true,
            'stock_quantity' => $stock,
            'average_cost' => $averageCost,
            'status' => $stock > 0 ? 'in-stock' : 'out-of-stock',
            'allow_negative_stock' => false,
            'location' => 'Main store',
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
        Product $finished,
        array $items,
        string $kind = ProductComposition::KIND_ASSEMBLY,
    ): ProductComposition {
        return app(CompositionService::class)->save(new SaveCompositionData(
            productId: $finished->id,
            kind: $kind,
            items: $items,
            name: 'Manufacturing formula',
            outputQuantity: 1,
            outputUnitId: $finished->base_unit_id,
        ), 'tester');
    }

    private function order(Product $finished, ProductComposition $composition, float $planned = 1): ProductionOrder
    {
        return app(ProductionService::class)->create([
            'product_id' => $finished->id,
            'composition_id' => $composition->id,
            'planned_quantity' => $planned,
            'output_unit_id' => $finished->base_unit_id,
            'location' => 'Main store',
            'planned_date' => '2026-11-15',
        ], 'tester');
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'active' => true]);
    }

    private function salesman(): User
    {
        return User::factory()->create(['role' => 'salesman', 'active' => true]);
    }

    public function test_draft_order_is_inventory_neutral_and_can_be_updated(): void
    {
        $finished = $this->product('Finished');
        $component = $this->product('Component', 'ml', 100, 5);
        $composition = $this->composition($finished, [$this->item($component, 2)]);

        $order = $this->order($finished, $composition, 3);
        $this->assertSame(ProductionOrder::STATUS_DRAFT, $order->status);
        $this->assertSame(0, InventoryTransaction::count());
        $this->assertSame(0.0, (float) $finished->fresh()->stock_quantity);

        $updated = app(ProductionService::class)->updateDraft($order, [
            'planned_quantity' => 4,
            'location' => 'Room A',
        ], 'tester');

        $this->assertSame(4.0, (float) $updated->planned_quantity);
        $this->assertSame('Room A', $updated->location);
        $this->assertSame(0, InventoryTransaction::count());
    }

    public function test_production_consumes_components_and_receives_finished_goods(): void
    {
        $finished = $this->product('Finished', 'piece', 0, null, 200);
        $first = $this->product('Raw A', 'ml', 100, 2);
        $second = $this->product('Raw B', 'g', 100, 10);
        $composition = $this->composition($finished, [
            $this->item($first, 5),
            $this->item($second, 2),
        ]);

        $order = $this->order($finished, $composition, 2);
        $completed = app(ProductionService::class)->execute($order, 2, 'piece', 'prod-key-1', 'tester', null, '2026-11-15');

        $this->assertSame(ProductionOrder::STATUS_COMPLETED, $completed->status);
        $this->assertSame(2.0, (float) $finished->fresh()->stock_quantity);
        $this->assertSame(30.0, (float) $finished->fresh()->average_cost);
        $this->assertSame(90.0, (float) $first->fresh()->stock_quantity);
        $this->assertSame(96.0, (float) $second->fresh()->stock_quantity);
        $this->assertSame(60.0, (float) $completed->total_cost);
        $this->assertSame(30.0, (float) $completed->unit_cost);
        $this->assertTrue($completed->cost_complete);
        $this->assertSame('exact', $completed->cost_basis);
        $this->assertSame(1, CompositionRun::count());
        $this->assertSame('production', CompositionRun::firstOrFail()->source_type);
        $this->assertSame($order->id, CompositionRun::firstOrFail()->source_id);
        $this->assertSame(1, InventoryTransaction::where('type', 'production')->count());
        $this->assertSame(0, Sale::count());
    }

    public function test_finished_goods_sold_later_use_production_cost(): void
    {
        $finished = $this->product('Finished', 'piece', 0, null, 200);
        $raw = $this->product('Raw', 'ml', 100, 4);
        $composition = $this->composition($finished, [$this->item($raw, 2)]);
        $order = $this->order($finished, $composition, 2);
        app(ProductionService::class)->execute($order, 2, 'piece', 'prod-sale-key', 'tester');

        $sale = app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-MFG-'.uniqid(),
            customerId: 0,
            customerName: 'Walk-in',
            date: '2026-11-15',
            items: [SaleItemData::fromArray([
                'product_id' => $finished->id,
                'product_name' => $finished->name,
                'quantity' => 1,
                'base_unit_quantity' => 1,
                'base_quantity' => 1,
                'unit_price' => 200,
                'total' => 200,
            ])],
            discount: 0,
            amountPaid: 200,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'tester',
        ));

        $saleItem = $sale->items()->firstOrFail();
        $cogs = app(CogsCalculator::class)->summary('2026-11-15', '2026-11-15');

        $this->assertSame(8.0, (float) $saleItem->cost_price);
        $this->assertSame(8.0, $cogs['cogs']);
        $this->assertSame(1.0, (float) $finished->fresh()->stock_quantity);
    }

    public function test_incomplete_component_cost_does_not_enter_finished_goods_average(): void
    {
        $finished = $this->product('Finished', 'piece', 0, null, 200);
        $known = $this->product('Known', 'ml', 100, 5);
        $unknown = $this->product('Unknown', 'ml', 100);
        $composition = $this->composition($finished, [
            $this->item($known, 1),
            $this->item($unknown, 1),
        ]);
        $order = $this->order($finished, $composition, 1);

        $completed = app(ProductionService::class)->execute($order, 1, 'piece', 'prod-partial-key', 'tester');

        $product = $finished->fresh();
        $this->assertFalse($completed->cost_complete);
        $this->assertNull($completed->unit_cost);
        $this->assertSame(5.0, (float) $completed->total_cost);
        $this->assertNull($product->average_cost);
        $this->assertSame(1.0, (float) $product->uncosted_qty);
        $this->assertSame(1.0, (float) $product->stock_quantity);
        $this->assertNull(InventoryTransaction::where('type', 'production')->firstOrFail()->unit_cost);
    }

    public function test_insufficient_component_rolls_back_the_entire_production(): void
    {
        $finished = $this->product('Finished');
        $raw = $this->product('Scarce', 'ml', 1, 5);
        $composition = $this->composition($finished, [$this->item($raw, 5)]);
        $order = $this->order($finished, $composition, 1);

        try {
            app(ProductionService::class)->execute($order, 1, 'piece', 'prod-shortage', 'tester');
            $this->fail('Insufficient component should have rejected production.');
        } catch (\Throwable) {
            // Expected.
        }

        $this->assertSame(ProductionOrder::STATUS_DRAFT, $order->fresh()->status);
        $this->assertSame(0, CompositionRun::count());
        $this->assertSame(0, InventoryTransaction::count());
        $this->assertSame(0.0, (float) $finished->fresh()->stock_quantity);
        $this->assertSame(1.0, (float) $raw->fresh()->stock_quantity);
    }

    public function test_reversal_removes_finished_goods_without_restoring_components(): void
    {
        $finished = $this->product('Finished');
        $raw = $this->product('Raw', 'ml', 100, 5);
        $composition = $this->composition($finished, [$this->item($raw, 2)]);
        $order = $this->order($finished, $composition, 2);
        $completed = app(ProductionService::class)->execute($order, 2, 'piece', 'prod-reverse', 'tester');

        $reversed = app(ProductionService::class)->reverse($completed, 'reverse-key-1', 'tester');

        $this->assertSame(ProductionOrder::STATUS_REVERSED, $reversed->status);
        $this->assertSame(0.0, (float) $finished->fresh()->stock_quantity);
        $this->assertSame(96.0, (float) $raw->fresh()->stock_quantity);
        $this->assertNotNull($reversed->reversal_inventory_transaction_id);
        $this->assertSame(
            -2.0,
            (float) InventoryTransaction::where('type', 'production')->orderByDesc('id')->first()->quantity
        );
        $this->assertSame(1, CompositionRun::count());
        $this->assertSame(4.0, (float) CompositionRun::firstOrFail()->items()->first()->actual_quantity);
    }

    public function test_reversal_is_idempotent_and_rejects_when_finished_stock_is_gone(): void
    {
        $finished = $this->product('Finished');
        $raw = $this->product('Raw', 'ml', 100, 5);
        $composition = $this->composition($finished, [$this->item($raw, 2)]);
        $order = $this->order($finished, $composition, 2);
        $completed = app(ProductionService::class)->execute($order, 2, 'piece', 'prod-reverse-2', 'tester');

        $first = app(ProductionService::class)->reverse($completed, 'reverse-key-2', 'tester');
        $second = app(ProductionService::class)->reverse($first, 'reverse-key-2', 'tester');

        $this->assertSame($first->id, $second->id);
        $this->assertSame(1, InventoryTransaction::where('type', 'production')->where('reference', 'like', 'REV-%')->count());

        DB::table('products')->where('id', $finished->id)->update(['stock_quantity' => 0]);
        $order2 = $this->order($finished, $composition, 1);
        $completed2 = app(ProductionService::class)->execute($order2, 1, 'piece', 'prod-reverse-3', 'tester');
        DB::table('products')->where('id', $finished->id)->update(['stock_quantity' => 0]);

        $this->assertSame(ProductionOrder::STATUS_COMPLETED, $completed2->fresh()->status);
        $this->assertSame(0.0, (float) $finished->fresh()->stock_quantity);
        $this->assertSame(1.0, (float) $completed2->actual_output_base_quantity);

        $this->expectException(ValidationException::class);
        app(ProductionService::class)->reverse($completed2, 'reverse-key-3', 'tester');
    }

    public function test_execution_idempotency_does_not_produce_twice(): void
    {
        $finished = $this->product('Finished');
        $raw = $this->product('Raw', 'ml', 100, 5);
        $composition = $this->composition($finished, [$this->item($raw, 2)]);
        $order = $this->order($finished, $composition, 1);

        $first = app(ProductionService::class)->execute($order, 1, 'piece', 'prod-idem-key', 'tester');
        $second = app(ProductionService::class)->execute($order, 1, 'piece', 'prod-idem-key', 'tester');

        $this->assertSame($first->id, $second->id);
        $this->assertSame(1.0, (float) $finished->fresh()->stock_quantity);
        $this->assertSame(1, InventoryTransaction::where('type', 'production')->count());
        $this->assertSame(1, CompositionRun::count());
    }

    public function test_component_usage_report_uses_production_snapshots(): void
    {
        $finished = $this->product('Finished');
        $raw = $this->product('Raw', 'ml', 100, 5);
        $composition = $this->composition($finished, [$this->item($raw, 3, 10)]);
        $order = $this->order($finished, $composition, 2);
        // The report filters on completed_at, which comes from now(). Using a
        // fixed calendar date made this test fail as soon as the clock advanced,
        // so derive the window from the same clock the service writes with.
        $today = now()->format('Y-m-d');
        app(ProductionService::class)->execute($order, 2, 'piece', 'prod-report', 'tester', null, $today);

        $filters = new ReportFilters(dateFrom: $today, dateTo: $today);
        $report = app(ProductionReportService::class)->componentUsage($filters);
        $row = $report['rows'][0];

        $this->assertSame('manufacturing', $row['source']);
        $this->assertSame($raw->id, $row['component_product_id']);
        $this->assertSame(6.6, $row['actual_quantity']);
        $this->assertSame(6.0, $row['template_quantity']);
        $this->assertSame(0.6, $row['wastage_quantity']);
        $this->assertSame(33.0, $row['total_cost']);
        $this->assertSame(2.0, $row['production_output_quantity']);
        $this->assertSame(33.0, $row['production_total_cost']);
        $this->assertTrue($row['production_cost_complete']);
        $this->assertSame(6.6, $report['summary']['manufacturing_quantity']);
        $this->assertSame(33.0, $report['summary']['production_cost']);
        $this->assertCount(1, $report['by_component']);
    }

    public function test_component_usage_report_includes_pos_consumption(): void
    {
        $service = $this->product('Service', 'piece', 10, null, 100);
        $raw = $this->product('Raw', 'ml', 100, 5);
        $this->composition($service, [$this->item($raw, 2)], ProductComposition::KIND_CONSUMPTION);

        app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-USAGE-'.uniqid(),
            customerId: 0,
            customerName: 'Walk-in',
            date: '2026-11-15',
            items: [SaleItemData::fromArray([
                'product_id' => $service->id,
                'product_name' => $service->name,
                'quantity' => 1,
                'base_unit_quantity' => 1,
                'base_quantity' => 1,
                'unit_price' => 100,
                'total' => 100,
            ])],
            discount: 0,
            amountPaid: 100,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'tester',
        ));

        $report = app(ProductionReportService::class)->componentUsage(new ReportFilters(
            dateFrom: '2026-11-15',
            dateTo: '2026-11-15',
            location: 'Main store',
        ));

        $this->assertSame(1, $report['summary']['row_count']);
        $this->assertSame('pos', $report['rows'][0]['source']);
        $this->assertSame(2.0, $report['rows'][0]['actual_quantity']);
        $this->assertSame(10.0, $report['rows'][0]['total_cost']);
        $this->assertSame(2.0, $report['summary']['pos_quantity']);
    }

    public function test_reversal_rebases_weighted_average_to_remaining_stock_cost(): void
    {
        $finished = $this->product('Finished');
        $raw = $this->product('Raw', 'ml', 100, 5);
        $composition = $this->composition($finished, [$this->item($raw, 1)]);

        $firstOrder = $this->order($finished, $composition, 1);
        $first = app(ProductionService::class)->execute($firstOrder, 1, 'piece', 'prod-avg-1', 'tester');

        DB::table('products')->where('id', $raw->id)->update(['average_cost' => 10]);

        $secondOrder = $this->order($finished, $composition, 1);
        app(ProductionService::class)->execute($secondOrder, 1, 'piece', 'prod-avg-2', 'tester');

        $this->assertSame(2.0, (float) $finished->fresh()->stock_quantity);
        $this->assertSame(7.5, (float) $finished->fresh()->average_cost);

        app(ProductionService::class)->reverse($first, 'reverse-avg-1', 'tester');

        $product = $finished->fresh();
        $this->assertSame(1.0, (float) $product->stock_quantity);
        $this->assertSame(10.0, (float) $product->average_cost);
        $this->assertSame(10.0, (float) $product->stock_quantity * (float) $product->average_cost);
    }

    public function test_sale_of_incomplete_finished_stock_is_flagged_and_not_fabricated(): void
    {
        $finished = $this->product('Finished', 'piece', 0, null, 200);
        $known = $this->product('Known', 'ml', 100, 5);
        $unknown = $this->product('Unknown', 'ml', 100);
        $composition = $this->composition($finished, [
            $this->item($known, 1),
            $this->item($unknown, 1),
        ]);
        $order = $this->order($finished, $composition, 1);
        app(ProductionService::class)->execute($order, 1, 'piece', 'prod-incomplete-sale', 'tester');

        $sale = app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-INCOMPLETE-'.uniqid(),
            customerId: 0,
            customerName: 'Walk-in',
            date: '2026-11-15',
            items: [SaleItemData::fromArray([
                'product_id' => $finished->id,
                'product_name' => $finished->name,
                'quantity' => 1,
                'base_unit_quantity' => 1,
                'base_quantity' => 1,
                'unit_price' => 200,
                'total' => 200,
            ])],
            discount: 0,
            amountPaid: 200,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'tester',
        ));

        $item = $sale->items()->firstOrFail();
        $summary = app(CogsCalculator::class)->summary('2026-11-15', '2026-11-15');

        $this->assertFalse($item->cost_complete);
        $this->assertSame(1.0, (float) $item->uncosted_quantity);
        $this->assertNull($item->cost_price);
        $this->assertSame(0.0, (float) $summary['cogs']);
        $this->assertFalse($summary['cost_complete']);
        $this->assertFalse($summary['simple_cost_complete']);
        $this->assertSame(1, $summary['uncosted_simple_items']);
        $this->assertSame(1, $summary['uncosted_simple_lines']);
        $this->assertSame(0.0, (float) $finished->fresh()->uncosted_qty);
    }

    public function test_mixed_costed_and_uncosted_sale_keeps_known_cost_but_flags_incomplete(): void
    {
        $product = $this->product('Mixed', 'piece', 2, 10, 50);
        DB::table('products')->where('id', $product->id)->update(['uncosted_qty' => 1]);

        $sale = app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-MIXED-'.uniqid(),
            customerId: 0,
            customerName: 'Walk-in',
            date: '2026-11-15',
            items: [SaleItemData::fromArray([
                'product_id' => $product->id,
                'product_name' => $product->name,
                'quantity' => 2,
                'base_unit_quantity' => 1,
                'base_quantity' => 2,
                'unit_price' => 50,
                'total' => 100,
            ])],
            discount: 0,
            amountPaid: 100,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'tester',
        ));

        $item = $sale->items()->firstOrFail();
        $summary = app(CogsCalculator::class)->summary('2026-11-15', '2026-11-15');

        $this->assertFalse($item->cost_complete);
        $this->assertSame(1.0, (float) $item->uncosted_quantity);
        $this->assertSame(5.0, (float) $item->cost_price);
        $this->assertSame(10.0, (float) $summary['cogs']);
        $this->assertFalse($summary['cost_complete']);
        $this->assertSame(1, $summary['uncosted_simple_items']);
        $this->assertSame(0.0, (float) $product->fresh()->uncosted_qty);
    }

    public function test_production_rejects_a_composition_from_another_product(): void
    {
        $finished = $this->product('Finished');
        $other = $this->product('Other');
        $raw = $this->product('Raw', 'ml', 100, 5);
        $composition = $this->composition($other, [$this->item($raw, 1)]);

        $this->expectException(ValidationException::class);

        app(ProductionService::class)->create([
            'product_id' => $finished->id,
            'composition_id' => $composition->id,
            'planned_quantity' => 1,
            'output_unit_id' => 'piece',
        ], 'tester');
    }

    public function test_admin_can_open_production_pages_and_reports(): void
    {
        $finished = $this->product('Finished');
        $raw = $this->product('Raw', 'ml', 100, 5);
        $composition = $this->composition($finished, [$this->item($raw, 2)]);
        $order = $this->order($finished, $composition, 1);
        $this->withoutVite();

        $this->actingAs($this->admin())->get('/production')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('production/ProductionList'));
        $this->actingAs($this->admin())->get('/production/create')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('production/ProductionCreate'));
        $this->actingAs($this->admin())->get("/production/{$order->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('production/ProductionDetail'));
        $this->actingAs($this->admin())->get('/reports/component-usage')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('production/ComponentUsageReport'));
        $this->actingAs($this->admin())->get('/reports/production-history')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('production/ProductionHistoryReport'));

        $this->actingAs($this->salesman())->get('/production')->assertForbidden();
    }

    public function test_salesman_cannot_create_or_execute_production(): void
    {
        $finished = $this->product('Finished');
        $raw = $this->product('Raw', 'ml', 100, 5);
        $composition = $this->composition($finished, [$this->item($raw, 2)]);

        $this->actingAs($this->salesman())
            ->post('/production', [
                'product_id' => $finished->id,
                'composition_id' => $composition->id,
                'planned_quantity' => 1,
                'output_unit_id' => 'piece',
            ])
            ->assertForbidden();

        $this->actingAs($this->admin())
            ->post('/production', [
                'product_id' => $finished->id,
                'composition_id' => $composition->id,
                'planned_quantity' => 1,
                'output_unit_id' => 'piece',
            ])
            ->assertRedirect();

        $order = ProductionOrder::firstOrFail();

        $this->actingAs($this->salesman())
            ->post("/production/{$order->id}/execute", [
                'actual_output_quantity' => 1,
                'output_unit_id' => 'piece',
            ])
            ->assertForbidden();

        $this->assertSame(0, CompositionRun::count());
    }
}
