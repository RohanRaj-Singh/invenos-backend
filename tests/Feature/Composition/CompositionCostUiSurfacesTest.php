<?php

namespace Tests\Feature\Composition;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Composition\Services\CompositionService;
use App\Domains\Returns\DTOs\ReturnCreateData;
use App\Domains\Returns\DTOs\ReturnItemData;
use App\Domains\Returns\Services\ReturnService;
use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\DTOs\SaleItemData;
use App\Domains\Sales\Services\SaleService;
use App\Models\CompositionRun;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\SellingUnit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regression coverage for the cost-permission boundaries on plain Inertia
 * pages (sale detail and return detail), which the composition endpoints do not
 * cover.
 */
class CompositionCostUiSurfacesTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role = 'admin'): User
    {
        return User::factory()->create(['role' => $role, 'active' => true]);
    }

    private function sale(): array
    {
        $product = Product::create([
            'name' => 'Sellable',
            'sku' => 'UI-'.uniqid(),
            'base_unit_id' => 'piece',
            'track_inventory' => true,
            'stock_quantity' => 10,
            'average_cost' => 40,
        ]);

        SellingUnit::create([
            'product_id' => $product->id,
            'name' => 'Single',
            'unit_id' => 'piece',
            'quantity' => 1,
            'sale_price' => 100,
            'is_default' => true,
        ]);

        $sale = app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-UI-'.uniqid(),
            customerId: 0,
            customerName: 'Walk-in',
            date: now()->format('Y-m-d'),
            items: [new SaleItemData($product->id, 'Sellable', 1, 1, 1, 100, 100, 'piece', 0, 'General')],
            discount: 0,
            amountPaid: 100,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'tester',
        ));

        return [$sale, $product];
    }

    public function test_sale_detail_withholds_line_cost_without_the_permission(): void
    {
        [$sale] = $this->sale();

        $page = $this->actingAs($this->user('salesman'))
            ->get("/sales/{$sale->id}")
            ->assertOk()
            ->viewData('page');

        $item = $page['props']['sale']['items'][0];

        $this->assertArrayNotHasKey('cost_price', $item);
        $this->assertArrayNotHasKey('cost_complete', $item);
        $this->assertArrayNotHasKey('uncosted_quantity', $item);

        // Commercial values must still be present.
        $this->assertSame(100, (int) $item['unit_price']);
    }

    public function test_sale_detail_includes_line_cost_with_the_permission(): void
    {
        [$sale] = $this->sale();

        $page = $this->actingAs($this->user('admin'))
            ->get("/sales/{$sale->id}")
            ->assertOk()
            ->viewData('page');

        $item = $page['props']['sale']['items'][0];

        $this->assertArrayHasKey('cost_price', $item);
        $this->assertSame(40.0, (float) $item['cost_price']);
    }

    public function test_sale_print_payload_also_withholds_cost_without_the_permission(): void
    {
        [$sale] = $this->sale();

        $page = $this->actingAs($this->user('salesman'))
            ->get("/sales/{$sale->id}/print")
            ->assertOk()
            ->viewData('page');

        $this->assertArrayNotHasKey('cost_price', $page['props']['sale']['items'][0]);
    }

    /** Builds a formula sale plus a return that restores part of an ingredient. */
    private function returnWithRecovery(): int
    {
        $formula = Product::create([
            'name' => 'Formula', 'sku' => 'FML-'.uniqid(), 'base_unit_id' => 'g',
            'track_inventory' => true, 'stock_quantity' => 0,
        ]);
        SellingUnit::create([
            'product_id' => $formula->id, 'name' => 'Formula', 'unit_id' => 'g',
            'quantity' => 1, 'sale_price' => 500, 'is_default' => true,
        ]);

        $ingredient = Product::create([
            'name' => 'Ingredient', 'sku' => 'ING-'.uniqid(), 'base_unit_id' => 'g',
            'track_inventory' => true, 'stock_quantity' => 100, 'average_cost' => 4,
        ]);

        $composition = app(CompositionService::class)->save(new SaveCompositionData(
            productId: $formula->id,
            kind: ProductComposition::KIND_CONSUMPTION,
            items: [new CompositionItemData(
                componentProductId: $ingredient->id,
                quantityBase: 10,
                displayUnitId: 'g',
            )],
            name: 'Refund formula',
            outputQuantity: 1,
            outputUnitId: 'g',
        ), 'tester');

        $sale = app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-UI-'.uniqid(),
            customerId: 0,
            customerName: 'Walk-in',
            date: now()->format('Y-m-d'),
            items: [new SaleItemData(
                $formula->id, 'Formula', 1, 1, 1, 500, 500, 'g', 0, 'General',
                formulaCompositionId: $composition->id,
            )],
            discount: 0,
            amountPaid: 500,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'tester',
        ));

        $saleItem = $sale->items()->firstOrFail();
        $runItem = CompositionRun::firstOrFail()->items()->firstOrFail();

        $return = app(ReturnService::class)->createReturn(new ReturnCreateData(
            type: 'SALE',
            referenceId: $sale->id,
            referenceType: 'sale',
            returnNumber: '',
            returnDate: now()->format('Y-m-d'),
            contactId: 0,
            contactName: 'Walk-in',
            reasonId: null,
            reasonNote: 'ui cost check',
            items: [new ReturnItemData(
                referenceItemId: (int) $saleItem->id,
                referenceItemType: 'sale_item',
                productId: $formula->id,
                productName: 'Formula',
                sellingUnitId: null,
                packagingName: 'Formula',
                quantity: 1,
                baseQuantity: 1,
                unitPrice: 500,
                total: 500,
                reasonId: null,
                notes: null,
                restock: true,
                materialRecoveries: [
                    ['composition_run_item_id' => (int) $runItem->id, 'quantity' => 5],
                ],
            )],
            subtotal: 500,
            discount: 0,
            grandTotal: 500,
            refundAmount: 500,
            refundMethod: 'cash',
            notes: null,
            createdBy: 'tester',
        ));

        return $return->id;
    }

    public function test_return_detail_withholds_recovery_cost_without_the_permission(): void
    {
        $id = $this->returnWithRecovery();

        $page = $this->actingAs($this->user('salesman'))
            ->get("/returns/{$id}")
            ->assertOk()
            ->viewData('page');

        $this->assertFalse($page['props']['can_view_cost']);

        $json = json_encode($page['props']['return']);
        foreach (['unit_cost', 'total_cost', 'average_cost', 'opening_cost', 'last_purchase_cost'] as $needle) {
            $this->assertStringNotContainsString($needle, $json);
        }

        // Quantities stay visible so the user can still understand the recovery.
        $this->assertStringContainsString('recovered_quantity', $json);
    }

    public function test_return_detail_includes_recovery_cost_with_the_permission(): void
    {
        $id = $this->returnWithRecovery();

        $page = $this->actingAs($this->user('admin'))
            ->get("/returns/{$id}")
            ->assertOk()
            ->viewData('page');

        $this->assertTrue($page['props']['can_view_cost']);
        $this->assertNotEmpty($page['props']['return']['component_recoveries']);
        $this->assertArrayHasKey('unit_cost', $page['props']['return']['component_recoveries'][0]);
    }
}
