<?php

namespace Tests\Feature\Composition;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Composition\Services\CompositionService;
use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\DTOs\SaleItemData;
use App\Domains\Sales\Services\SaleService;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\SellingUnit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompositionFrontendContractTest extends TestCase
{
    use RefreshDatabase;

    private function product(
        string $name,
        string $unit = 'piece',
        float $stock = 0,
        ?float $cost = null,
    ): Product {
        $product = Product::create([
            'name' => $name.' '.uniqid(),
            'sku' => 'FE-'.uniqid(),
            'base_unit_id' => $unit,
            'track_inventory' => true,
            'stock_quantity' => $stock,
            'average_cost' => $cost,
            'status' => $stock > 0 ? 'in-stock' : 'out-of-stock',
            'allow_negative_stock' => false,
        ]);

        SellingUnit::create([
            'product_id' => $product->id,
            'name' => $unit === 'piece' ? 'Piece' : $unit,
            'unit_id' => $unit,
            'quantity' => 1,
            'sale_price' => 100,
            'is_default' => true,
        ]);

        return $product;
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'active' => true]);
    }

    public function test_product_contract_exposes_active_composition_kinds(): void
    {
        $service = $this->product('Service');
        $finished = $this->product('Finished');
        $component = $this->product('Component', 'ml', 100, 5);

        app(CompositionService::class)->save(new SaveCompositionData(
            productId: $service->id,
            kind: ProductComposition::KIND_CONSUMPTION,
            items: [new CompositionItemData(
                componentProductId: $component->id,
                quantityBase: 2,
                displayUnitId: 'ml',
            )],
            name: 'Consumption formula',
            outputQuantity: 1,
            outputUnitId: 'piece',
        ), 'tester');

        app(CompositionService::class)->save(new SaveCompositionData(
            productId: $finished->id,
            kind: ProductComposition::KIND_ASSEMBLY,
            items: [new CompositionItemData(
                componentProductId: $component->id,
                quantityBase: 1,
                displayUnitId: 'ml',
            )],
            name: 'Assembly formula',
            outputQuantity: 1,
            outputUnitId: 'piece',
        ), 'tester');

        $response = $this->actingAs($this->admin())->get('/inventory');
        $response->assertOk();

        $page = $response->viewData('page');
        $rows = collect($page['props']['products'])->keyBy('id');

        $this->assertTrue((bool) $rows[$service->id]['has_consumption_composition']);
        $this->assertFalse((bool) $rows[$service->id]['has_assembly_composition']);
        $this->assertFalse((bool) $rows[$finished->id]['has_consumption_composition']);
        $this->assertTrue((bool) $rows[$finished->id]['has_assembly_composition']);

        $detailResponse = $this->actingAs($this->admin())->get("/inventory/product/{$service->id}");
        $detailResponse->assertOk();
        $detail = $detailResponse->viewData('page')['props']['product'];
        $this->assertTrue((bool) $detail['has_consumption_composition']);
        $this->assertFalse((bool) $detail['has_assembly_composition']);

        $formulaOnly = $this->actingAs($this->admin())->get('/inventory?composition=formula');
        $formulaOnly->assertOk();
        $formulaRows = collect($formulaOnly->viewData('page')['props']['products'])->keyBy('id');

        $this->assertTrue($formulaRows->has($service->id));
        $this->assertFalse($formulaRows->has($finished->id));
    }

    public function test_product_create_can_hand_off_to_formula_tab(): void
    {
        $response = $this->actingAs($this->admin())->post('/inventory', [
            'name' => 'Formula handoff product',
            'sku' => 'HANDOFF-1',
            'base_unit_id' => 'piece',
            'track_inventory' => true,
            'stock_quantity' => 0,
            'selling_units' => [[
                'name' => 'Piece',
                'sale_price' => 100,
                'quantity' => 1,
                'is_default' => true,
            ]],
            '_setup_formula' => true,
        ]);

        $product = Product::where('sku', 'HANDOFF-1')->firstOrFail();

        $response->assertRedirect(route('inventory.show', [
            'id' => $product->id,
            'tab' => 'composition',
        ]));
    }

    public function test_sale_detail_contract_includes_safe_composition_snapshot(): void
    {
        $service = $this->product('Service');
        $component = $this->product('Component', 'ml', 100, 5);

        app(CompositionService::class)->save(new SaveCompositionData(
            productId: $service->id,
            kind: ProductComposition::KIND_CONSUMPTION,
            items: [new CompositionItemData(
                componentProductId: $component->id,
                quantityBase: 2,
                displayUnitId: 'ml',
            )],
            name: 'Consumption formula',
            outputQuantity: 1,
            outputUnitId: 'piece',
        ), 'tester');

        $sale = app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-FE-'.uniqid(),
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

        $response = $this->actingAs($this->admin())->get("/sales/{$sale->id}");

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('sales/SaleDetail')
            ->has('sale.composition_runs', 1)
            ->where('sale.composition_runs.0.status', 'completed')
            ->has('sale.composition_runs.0.items', 1)
            ->where('sale.composition_runs.0.items.0.component_name', $component->name)
            ->where('sale.composition_runs.0.items.0.actual_quantity', 2));

        $page = $response->viewData('page');
        $item = $page['props']['sale']['composition_runs'][0]['items'][0];

        $this->assertArrayNotHasKey('unit_cost', $item);
        $this->assertArrayNotHasKey('total_cost', $item);

        $salesman = User::factory()->create(['role' => 'salesman', 'active' => true]);
        $salesmanResponse = $this->actingAs($salesman)->get("/sales/{$sale->id}");
        $salesmanResponse->assertOk();
        $salesmanPage = $salesmanResponse->viewData('page');

        $this->assertArrayHasKey('composition_runs', $salesmanPage['props']['sale']);
        $salesmanItem = $salesmanPage['props']['sale']['composition_runs'][0]['items'][0];
        $this->assertArrayNotHasKey('unit_cost', $salesmanItem);
        $this->assertArrayNotHasKey('total_cost', $salesmanItem);
    }
}
