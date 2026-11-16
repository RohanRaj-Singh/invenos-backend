<?php

namespace Tests\Feature\Composition;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Composition\Services\CompositionService;
use App\Domains\Reports\Services\CogsCalculator;
use App\Domains\Returns\DTOs\ReturnCreateData;
use App\Domains\Returns\DTOs\ReturnItemData;
use App\Domains\Returns\Services\ReturnService;
use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\DTOs\SaleItemData;
use App\Domains\Sales\Services\SaleService;
use App\Models\CompositionRun;
use App\Models\Contact;
use App\Models\FinancialTransaction;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\PurchaseBill;
use App\Models\ReturnComponentRecovery;
use App\Models\ReturnModel;
use App\Models\Sale;
use App\Models\SellingUnit;
use App\Models\User;
use App\Services\Lifecycle\RecordLifecycleService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

/**
 * P6 — composition returns, reversals and material restoration.
 *
 * The commercial return (refund, credit note, returned quantity) and the
 * physical material recovery are deliberately separate facts.
 */
class CompositionReturnsTest extends TestCase
{
    use RefreshDatabase;

    private Contact $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = Contact::create([
            'type' => 'person',
            'roles' => ['customer'],
            'name' => 'Return Customer',
            'phone' => '0300-'.random_int(1000000, 9999999),
        ]);
    }

    // ─── Fixtures ──────────────────────────────────────────────

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'active' => true]);
    }

    private function salesman(): User
    {
        return User::factory()->create(['role' => 'salesman', 'active' => true]);
    }

    private function product(
        string $name,
        string $unit = 'ml',
        float $stock = 100,
        ?float $cost = null,
    ): Product {
        return Product::create([
            'name' => $name.' '.substr(uniqid(), -6),
            'sku' => 'P6-'.uniqid(),
            'base_unit_id' => $unit,
            'track_inventory' => true,
            'stock_quantity' => $stock,
            'status' => $stock > 0 ? 'in-stock' : 'out-of-stock',
            'allow_negative_stock' => false,
            'average_cost' => $cost,
        ]);
    }

    private function serviceProduct(float $price = 1000, float $stock = 10): Product
    {
        $product = $this->product('Service', 'piece', $stock);

        SellingUnit::create([
            'product_id' => $product->id,
            'name' => 'Single',
            'unit_id' => 'piece',
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
    private function composition(Product $parent, array $items): ProductComposition
    {
        return app(CompositionService::class)->save(new SaveCompositionData(
            productId: $parent->id,
            kind: ProductComposition::KIND_CONSUMPTION,
            items: $items,
            name: 'Return formula',
            outputQuantity: 1,
            outputUnitId: $parent->base_unit_id,
        ), 'tester');
    }

    private function sell(Product $service, float $quantity = 1, float $unitPrice = 1000): Sale
    {
        $sellingUnit = $service->sellingUnits()->first();

        return app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-'.uniqid(),
            customerId: $this->customer->id,
            customerName: $this->customer->name,
            date: '2026-11-15',
            items: [SaleItemData::fromArray([
                'product_id' => $service->id,
                'product_name' => $service->name,
                'quantity' => $quantity,
                'packaging_quantity' => $quantity,
                'base_unit_quantity' => 1,
                'base_quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total' => $quantity * $unitPrice,
                'packaging_name' => $sellingUnit->name,
                'selling_unit_id' => $sellingUnit->id,
            ])],
            discount: 0,
            amountPaid: $quantity * $unitPrice,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'tester',
        ));
    }

    /**
     * @param  array<int, array{composition_run_item_id: int, quantity: float}>  $recoveries
     */
    private function returnData(
        Sale $sale,
        float $quantity,
        array $recoveries = [],
        ?float $refund = null,
        float $unitPrice = 1000,
        ?string $idempotencyKey = null,
        ?int $referenceItemId = null,
    ): ReturnCreateData {
        $saleItem = $sale->items()->firstOrFail();
        $grandTotal = $quantity * $unitPrice;

        return new ReturnCreateData(
            type: 'SALE',
            referenceId: $sale->id,
            referenceType: 'sale',
            returnNumber: '',
            returnDate: '2026-11-16',
            contactId: $sale->customer_id ?? 0,
            contactName: $sale->customer_name,
            reasonId: null,
            reasonNote: 'Customer return',
            items: [new ReturnItemData(
                referenceItemId: $referenceItemId ?? (int) $saleItem->id,
                referenceItemType: 'sale_item',
                productId: (int) $saleItem->product_id,
                productName: $saleItem->product_name,
                sellingUnitId: $saleItem->selling_unit_id,
                packagingName: $saleItem->packaging_name,
                quantity: $quantity,
                baseQuantity: $quantity,
                unitPrice: $unitPrice,
                total: $grandTotal,
                reasonId: null,
                notes: null,
                restock: true,
                materialRecoveries: $recoveries,
            )],
            subtotal: $grandTotal,
            discount: 0,
            grandTotal: $grandTotal,
            refundAmount: $refund ?? $grandTotal,
            refundMethod: 'cash',
            notes: null,
            createdBy: 'tester',
            idempotencyKey: $idempotencyKey,
        );
    }

    /**
     * @return array{0: Sale, 1: Product}
     */
    private function soldFacial(float $unitPrice = 1000, float $quantity = 1, float $serumPerUnit = 5): array
    {
        $service = $this->serviceProduct($unitPrice);
        $serum = $this->product('Serum', 'ml', 100, 2.0);
        $this->composition($service, [$this->item($serum, $serumPerUnit)]);

        $sale = $this->sell($service, $quantity, $unitPrice);

        return [$sale, $serum];
    }

    private function complete(ReturnCreateData $data): ReturnModel
    {
        $service = app(ReturnService::class);
        $return = $service->createReturn($data);
        $service->completeReturn($return->id);

        return $return->fresh();
    }

    // ─── Commercial returns ────────────────────────────────────

    public function test_consumption_sale_can_be_returned_without_restoring_components(): void
    {
        [$sale, $serum] = $this->soldFacial();

        $this->assertSame(95.0, (float) $serum->fresh()->stock_quantity);

        $return = $this->complete($this->returnData($sale, 1));

        $this->assertSame('completed', $return->status);
        $this->assertSame('full', $sale->fresh()->return_status);
        $this->assertSame(1000.0, (float) $sale->fresh()->return_total);

        // No material was recovered, so component inventory is untouched.
        $this->assertSame(95.0, (float) $serum->fresh()->stock_quantity);

        // The commercial product was never deducted, so it is not restored.
        $this->assertSame(10.0, (float) $sale->items()->first()->product->fresh()->stock_quantity);
        $this->assertSame(
            0,
            InventoryTransaction::where('product_id', $sale->items()->first()->product_id)->count(),
        );
        $this->assertSame(0, ReturnComponentRecovery::count());
    }

    public function test_refund_and_credit_note_are_recorded_separately_from_material(): void
    {
        [$sale] = $this->soldFacial();

        $return = $this->complete($this->returnData($sale, 1, refund: 400));

        // Credit note -1000, refund 400 -> 600 credit remains.
        $this->assertSame(-600.0, (float) $this->customer->fresh()->current_balance);
        $this->assertDatabaseHas('financial_transactions', [
            'linked_return_id' => $return->id,
            'type' => 'refund',
            'direction' => 'out',
            'amount' => 400,
        ]);
    }

    public function test_partial_and_multiple_returns_are_supported_and_excess_is_rejected(): void
    {
        [$sale, $serum] = $this->soldFacial(quantity: 2);

        // Two treatments sold, 10ml consumed in total.
        $this->assertSame(90.0, (float) $serum->fresh()->stock_quantity);

        $this->complete($this->returnData($sale, 1));
        $this->complete($this->returnData($sale, 1, refund: 500));

        $this->assertSame(2, ReturnModel::where('status', 'completed')->count());
        $this->assertSame('full', $sale->fresh()->return_status);

        $this->expectException(\InvalidArgumentException::class);
        app(ReturnService::class)->createReturn($this->returnData($sale, 1));
    }

    public function test_return_line_must_belong_to_the_referenced_sale(): void
    {
        [$sale] = $this->soldFacial();
        [$otherSale] = $this->soldFacial();

        $data = $this->returnData($sale, 1, referenceItemId: (int) $otherSale->items()->first()->id);

        $this->expectException(ValidationException::class);
        app(ReturnService::class)->createReturn($data);
    }

    public function test_original_composition_run_is_preserved_and_immutable(): void
    {
        [$sale] = $this->soldFacial();
        $run = CompositionRun::with('items')->firstOrFail();
        $before = [
            'status' => $run->status,
            'total_cost' => $run->total_cost,
            'item_cost' => $run->items->first()->unit_cost,
            'item_qty' => $run->items->first()->actual_quantity,
        ];

        $this->complete($this->returnData($sale, 1, recoveries: [
            ['composition_run_item_id' => (int) $run->items->first()->id, 'quantity' => 5],
        ]));

        $run->refresh()->load('items');

        $this->assertSame($before['status'], $run->status);
        $this->assertSame($before['total_cost'], $run->total_cost);
        $this->assertSame($before['item_cost'], $run->items->first()->unit_cost);
        $this->assertSame($before['item_qty'], $run->items->first()->actual_quantity);
        $this->assertSame(1, CompositionRun::count());
    }

    // ─── Material restoration ─────────────────────────────────

    public function test_explicit_recovery_restores_components_with_a_canonical_movement(): void
    {
        [$sale, $serum] = $this->soldFacial();
        $runItem = CompositionRun::firstOrFail()->items()->firstOrFail();

        $return = $this->complete($this->returnData($sale, 1, recoveries: [
            ['composition_run_item_id' => (int) $runItem->id, 'quantity' => 5],
        ]));

        $this->assertSame(100.0, (float) $serum->fresh()->stock_quantity);

        $movement = InventoryTransaction::where('product_id', $serum->id)
            ->where('type', 'sale-return')
            ->firstOrFail();

        $this->assertSame(5.0, (float) $movement->quantity);
        $this->assertSame($return->return_number, $movement->reference);
        $this->assertSame('return', $movement->reference_type);
        $this->assertSame($return->id, (int) $movement->reference_id);
        $this->assertSame(2.0, $movement->unit_cost);

        $recovery = ReturnComponentRecovery::firstOrFail();
        $this->assertSame((int) $movement->id, (int) $recovery->inventory_transaction_id);
        $this->assertNotNull($recovery->restored_at);
        $this->assertSame(5.0, $recovery->recovered_quantity);

        // Restoration is not a purchase and creates no payable.
        $this->assertSame(0, PurchaseBill::count());
        $this->assertSame(0, InventoryTransaction::where('type', 'purchase')->count());
    }

    public function test_partial_component_recovery_is_allowed(): void
    {
        [$sale, $serum] = $this->soldFacial();
        $runItem = CompositionRun::firstOrFail()->items()->firstOrFail();

        $this->complete($this->returnData($sale, 1, recoveries: [
            ['composition_run_item_id' => (int) $runItem->id, 'quantity' => 2],
        ]));

        $this->assertSame(97.0, (float) $serum->fresh()->stock_quantity);
    }

    public function test_multiple_components_are_restored_separately(): void
    {
        $service = $this->serviceProduct();
        $serum = $this->product('Serum', 'ml', 100, 2.0);
        $mask = $this->product('Mask', 'piece', 100, 5.0);
        $this->composition($service, [$this->item($serum, 5), $this->item($mask, 1)]);

        $sale = $this->sell($service, 1);
        $runItems = CompositionRun::firstOrFail()->items()->get()->keyBy('component_product_id');

        $this->complete($this->returnData($sale, 1, recoveries: [
            ['composition_run_item_id' => (int) $runItems[$serum->id]->id, 'quantity' => 5],
            ['composition_run_item_id' => (int) $runItems[$mask->id]->id, 'quantity' => 1],
        ]));

        $this->assertSame(100.0, (float) $serum->fresh()->stock_quantity);
        $this->assertSame(100.0, (float) $mask->fresh()->stock_quantity);
        $this->assertSame(2, ReturnComponentRecovery::count());
        $this->assertSame(2, InventoryTransaction::where('type', 'sale-return')->count());
    }

    public function test_wastage_is_never_restored(): void
    {
        $service = $this->serviceProduct();
        $serum = $this->product('Wasted serum', 'ml', 100, 2.0);
        // 10 ml template + 10% wastage => 11 ml consumed.
        $this->composition($service, [$this->item($serum, 10, 10)]);

        $sale = $this->sell($service, 1);
        $runItem = CompositionRun::firstOrFail()->items()->firstOrFail();

        $this->assertSame(11.0, (float) $runItem->actual_quantity);
        $this->assertSame(10.0, (float) $runItem->template_quantity);

        // The 11th ml is wastage and cannot be restored.
        try {
            app(ReturnService::class)->createReturn($this->returnData($sale, 1, recoveries: [
                ['composition_run_item_id' => (int) $runItem->id, 'quantity' => 11],
            ]));
            $this->fail('Wastage must not be recoverable.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('items', $exception->errors());
        }

        $this->complete($this->returnData($sale, 1, recoveries: [
            ['composition_run_item_id' => (int) $runItem->id, 'quantity' => 10],
        ]));

        $this->assertSame(99.0, (float) $serum->fresh()->stock_quantity);
    }

    public function test_recovery_quantities_are_proportional_to_the_returned_quantity(): void
    {
        [$sale, $serum] = $this->soldFacial(quantity: 2);
        $runItem = CompositionRun::firstOrFail()->items()->firstOrFail();

        // Half the sale returned -> at most half of the 10 ml consumed.
        try {
            app(ReturnService::class)->createReturn($this->returnData($sale, 1, recoveries: [
                ['composition_run_item_id' => (int) $runItem->id, 'quantity' => 6],
            ]));
            $this->fail('Recovery cannot exceed the proportional eligible quantity.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('items', $exception->errors());
        }

        $this->complete($this->returnData($sale, 1, recoveries: [
            ['composition_run_item_id' => (int) $runItem->id, 'quantity' => 5],
        ]));

        $this->assertSame(95.0, (float) $serum->fresh()->stock_quantity);
    }

    public function test_multiple_returns_restore_only_their_own_share(): void
    {
        [$sale, $serum] = $this->soldFacial(quantity: 2);
        $runItem = CompositionRun::firstOrFail()->items()->firstOrFail();

        $this->complete($this->returnData($sale, 1, recoveries: [
            ['composition_run_item_id' => (int) $runItem->id, 'quantity' => 5],
        ]));
        $this->assertSame(95.0, (float) $serum->fresh()->stock_quantity);

        $this->complete($this->returnData($sale, 1, recoveries: [
            ['composition_run_item_id' => (int) $runItem->id, 'quantity' => 5],
        ]));
        $this->assertSame(100.0, (float) $serum->fresh()->stock_quantity);

        // A third return is impossible: the whole sale is already returned.
        $this->expectException(\InvalidArgumentException::class);
        app(ReturnService::class)->createReturn($this->returnData($sale, 1));
    }

    public function test_recovery_is_rejected_for_a_non_composition_sale_line(): void
    {
        $simple = $this->product('Simple sale', 'piece', 50);
        SellingUnit::create([
            'product_id' => $simple->id,
            'name' => 'Single',
            'unit_id' => 'piece',
            'quantity' => 1,
            'sale_price' => 100,
            'is_default' => true,
        ]);

        $sale = $this->sell($simple, 1, 100);
        $saleItem = $sale->items()->first();

        $this->expectException(ValidationException::class);
        app(ReturnService::class)->createReturn($this->returnData($sale, 1, recoveries: [
            ['composition_run_item_id' => 999999, 'quantity' => 1],
        ], unitPrice: 100));
    }

    public function test_recovery_of_a_foreign_run_item_is_rejected(): void
    {
        [$sale] = $this->soldFacial();
        [$otherSale] = $this->soldFacial();
        $foreignRunItem = CompositionRun::where('sale_item_id', $otherSale->items()->first()->id)
            ->firstOrFail()
            ->items()
            ->firstOrFail();

        $this->expectException(ValidationException::class);
        app(ReturnService::class)->createReturn($this->returnData($sale, 1, recoveries: [
            ['composition_run_item_id' => (int) $foreignRunItem->id, 'quantity' => 1],
        ]));
    }

    public function test_repeated_component_from_nested_paths_is_restored_once(): void
    {
        $service = $this->serviceProduct();
        $raw = $this->product('Raw serum', 'ml', 100, 1.0);
        $nested = $this->product('Nested service', 'piece', 0);

        // Nested consumption composition consumes 3 ml of the same raw serum.
        $this->composition($nested, [$this->item($raw, 3)]);
        // The parent consumes the nested service (scaled 1) plus 2 ml directly.
        $this->composition($service, [$this->item($nested, 1), $this->item($raw, 2)]);

        $sale = $this->sell($service, 1);

        $runs = CompositionRun::with('items')->get();
        $this->assertCount(1, $runs, 'Nested consumption must flatten into one run.');

        $rawLines = $runs->first()->items->where('component_product_id', $raw->id);
        $this->assertCount(1, $rawLines, 'Repeated components are aggregated.');
        $this->assertSame(5.0, (float) $rawLines->first()->actual_quantity);

        $this->complete($this->returnData($sale, 1, recoveries: [
            ['composition_run_item_id' => (int) $rawLines->first()->id, 'quantity' => 5],
        ]));

        $this->assertSame(100.0, (float) $raw->fresh()->stock_quantity);
        $this->assertSame(1, InventoryTransaction::where('product_id', $raw->id)->where('type', 'sale-return')->count());
    }

    public function test_restored_quantity_uses_the_component_base_unit(): void
    {
        $service = $this->serviceProduct();
        $serum = $this->product('Base unit serum', 'ml', 100, 2.0);
        $this->composition($service, [$this->item($serum, 2.5)]);

        $sale = $this->sell($service, 1);
        $runItem = CompositionRun::firstOrFail()->items()->firstOrFail();

        $this->complete($this->returnData($sale, 1, recoveries: [
            ['composition_run_item_id' => (int) $runItem->id, 'quantity' => 2.5],
        ]));

        $this->assertSame(100.0, (float) $serum->fresh()->stock_quantity);
        $this->assertSame('ml', InventoryTransaction::where('type', 'sale-return')->firstOrFail()->unit);
    }

    // ─── Idempotency ──────────────────────────────────────────

    public function test_duplicate_return_request_with_the_same_key_creates_one_return(): void
    {
        [$sale] = $this->soldFacial();
        $key = 'ret-idem-'.uniqid();

        $first = app(ReturnService::class)->createReturn($this->returnData($sale, 1, idempotencyKey: $key));
        $second = app(ReturnService::class)->createReturn($this->returnData($sale, 1, idempotencyKey: $key));

        $this->assertSame($first->id, $second->id);
        $this->assertSame(1, ReturnModel::count());
    }

    public function test_duplicate_idempotency_key_is_rejected_by_the_database(): void
    {
        [$sale] = $this->soldFacial();
        $key = 'ret-db-'.uniqid();

        app(ReturnService::class)->createReturn($this->returnData($sale, 1, idempotencyKey: $key));

        $this->expectException(QueryException::class);
        ReturnModel::create([
            'return_number' => 'SR-DUP-'.uniqid(),
            'idempotency_key' => $key,
            'type' => 'SALE',
            'reference_type' => 'sale',
            'reference_id' => $sale->id,
            'return_date' => '2026-11-16',
            'status' => 'pending',
        ]);
    }

    public function test_completion_is_idempotent_and_restores_material_only_once(): void
    {
        [$sale, $serum] = $this->soldFacial();
        $runItem = CompositionRun::firstOrFail()->items()->firstOrFail();

        $return = $this->complete($this->returnData($sale, 1, recoveries: [
            ['composition_run_item_id' => (int) $runItem->id, 'quantity' => 5],
        ]));

        try {
            app(ReturnService::class)->completeReturn($return->id);
            $this->fail('Completing a return twice must be rejected.');
        } catch (\InvalidArgumentException $exception) {
            $this->assertStringContainsString('expected', $exception->getMessage());
        }

        $this->assertSame(1, InventoryTransaction::where('type', 'sale-return')->count());
        $this->assertSame(100.0, (float) $serum->fresh()->stock_quantity);
        $this->assertSame(1, ReturnComponentRecovery::count());
    }

    public function test_completion_revalidates_against_other_completed_returns_and_rolls_back(): void
    {
        [$sale, $serum] = $this->soldFacial(quantity: 2);
        $runItem = CompositionRun::firstOrFail()->items()->firstOrFail();
        $service = app(ReturnService::class);

        $full = $service->createReturn($this->returnData($sale, 2, recoveries: [
            ['composition_run_item_id' => (int) $runItem->id, 'quantity' => 10],
        ]));
        $overlapping = $service->createReturn($this->returnData($sale, 1, recoveries: [
            ['composition_run_item_id' => (int) $runItem->id, 'quantity' => 5],
        ]));

        $service->completeReturn($full->id);
        $this->assertSame(100.0, (float) $serum->fresh()->stock_quantity);

        try {
            $service->completeReturn($overlapping->id);
            $this->fail('Completion must re-validate against other completed returns.');
        } catch (\InvalidArgumentException $exception) {
            $this->assertStringContainsString('Cannot complete return', $exception->getMessage());
        }

        // The failed completion rolled back completely.
        $this->assertSame('pending', $overlapping->fresh()->status);
        $this->assertNull($overlapping->fresh()->effects_applied_at);
        $this->assertSame(100.0, (float) $serum->fresh()->stock_quantity);
        $this->assertSame(1, InventoryTransaction::where('type', 'sale-return')->count());
        $this->assertSame(0, FinancialTransaction::where('linked_return_id', $overlapping->id)->count());
    }

    public function test_duplicate_restoration_row_is_rejected_by_the_database(): void
    {
        [$sale] = $this->soldFacial();
        $runItem = CompositionRun::firstOrFail()->items()->firstOrFail();

        $return = app(ReturnService::class)->createReturn($this->returnData($sale, 1, recoveries: [
            ['composition_run_item_id' => (int) $runItem->id, 'quantity' => 5],
        ]));

        $this->expectException(QueryException::class);

        ReturnComponentRecovery::create([
            'return_id' => $return->id,
            'return_item_id' => $return->items()->first()->id,
            'composition_run_id' => $runItem->composition_run_id,
            'composition_run_item_id' => $runItem->id,
            'component_product_id' => $runItem->component_product_id,
            'unit' => $runItem->unit,
            'basis_quantity' => 5,
            'eligible_quantity' => 5,
            'recovered_quantity' => 5,
        ]);
    }

    // ─── Costing ──────────────────────────────────────────────

    public function test_commercial_return_reverses_composition_cogs_without_touching_the_run(): void
    {
        [$sale, $serum] = $this->soldFacial();
        $cogs = app(CogsCalculator::class);
        $run = CompositionRun::firstOrFail();

        // 5 ml @ 2.0 = 10.0 composition COGS.
        $this->assertSame(10.0, $cogs->gross('2026-11-01', '2026-11-30'));
        $this->assertSame(10.0, $cogs->net('2026-11-01', '2026-11-30'));

        $this->complete($this->returnData($sale, 1));

        $summary = $cogs->summary('2026-11-01', '2026-11-30');
        $this->assertSame(10.0, $summary['cogs']);
        $this->assertSame(10.0, $summary['composition_cogs']);
        $this->assertTrue($summary['cost_complete']);

        // Full return of the only unit reverses the full composition COGS.
        $this->assertSame(0.0, $cogs->net('2026-11-01', '2026-11-30'));

        // The run snapshot is untouched.
        $this->assertSame($run->total_cost, CompositionRun::firstOrFail()->total_cost);
        $this->assertSame(95.0, (float) $serum->fresh()->stock_quantity);
        $this->assertSame(0, InventoryTransaction::where('type', 'sale-return')->count());
    }

    public function test_partial_return_reverses_cogs_proportionally(): void
    {
        [$sale] = $this->soldFacial(quantity: 2);
        $cogs = app(CogsCalculator::class);

        $this->assertSame(20.0, $cogs->net('2026-11-01', '2026-11-30'));

        $this->complete($this->returnData($sale, 1));

        $this->assertSame(10.0, $cogs->net('2026-11-01', '2026-11-30'));
    }

    public function test_material_restoration_does_not_create_a_second_cogs_reversal(): void
    {
        [$sale, $serum] = $this->soldFacial();
        $runItem = CompositionRun::firstOrFail()->items()->firstOrFail();
        $cogs = app(CogsCalculator::class);

        $this->complete($this->returnData($sale, 1, recoveries: [
            ['composition_run_item_id' => (int) $runItem->id, 'quantity' => 5],
        ]));

        // Restoration moves stock only; the COGS reversal is the return's.
        $this->assertSame(0.0, $cogs->net('2026-11-01', '2026-11-30'));
        $this->assertSame(10.0, $cogs->summary('2026-11-01', '2026-11-30')['cogs']);
        $this->assertSame(100.0, (float) $serum->fresh()->stock_quantity);
    }

    public function test_historical_run_cost_survives_component_cost_changes(): void
    {
        [$sale] = $this->soldFacial();
        $run = CompositionRun::firstOrFail();
        $snapshotCost = $run->total_cost;

        $run->items()->firstOrFail()->component->update(['average_cost' => 99]);

        $this->complete($this->returnData($sale, 1));

        $this->assertSame($snapshotCost, CompositionRun::firstOrFail()->total_cost);
        $this->assertSame(
            $snapshotCost,
            CompositionRun::firstOrFail()->items()->firstOrFail()->total_cost,
        );
    }

    // ─── Reversal ─────────────────────────────────────────────

    public function test_reversing_a_return_compensates_restoration_and_refund(): void
    {
        [$sale, $serum] = $this->soldFacial();
        $runItem = CompositionRun::firstOrFail()->items()->firstOrFail();

        $service = app(ReturnService::class);
        $return = $service->createReturn($this->returnData($sale, 1, recoveries: [
            ['composition_run_item_id' => (int) $runItem->id, 'quantity' => 5],
        ]));
        $service->completeReturn($return->id);

        $this->assertSame(100.0, (float) $serum->fresh()->stock_quantity);

        $service->reverseReturn($return->id, 'tester');

        // The component restoration is compensated with a REV- movement.
        $this->assertSame(95.0, (float) $serum->fresh()->stock_quantity);
        $this->assertSame('reversed', $return->fresh()->status);
        $this->assertSame(0.0, (float) $this->customer->fresh()->current_balance);
        $this->assertSame(0.0, (float) $sale->fresh()->return_total);

        // Reversed returns no longer reverse COGS.
        $this->assertSame(10.0, app(CogsCalculator::class)->net('2026-11-01', '2026-11-30'));
    }

    public function test_material_can_be_restored_again_after_a_reversal(): void
    {
        [$sale, $serum] = $this->soldFacial();
        $runItem = CompositionRun::firstOrFail()->items()->firstOrFail();
        $recoveries = [['composition_run_item_id' => (int) $runItem->id, 'quantity' => 5]];

        $service = app(ReturnService::class);
        $first = $service->createReturn($this->returnData($sale, 1, recoveries: $recoveries));
        $service->completeReturn($first->id);
        $service->reverseReturn($first->id, 'tester');

        $this->assertSame(95.0, (float) $serum->fresh()->stock_quantity);

        $second = $service->createReturn($this->returnData($sale, 1, recoveries: $recoveries));
        $service->completeReturn($second->id);

        $this->assertSame(100.0, (float) $serum->fresh()->stock_quantity);
    }

    // ─── Sale deletion ────────────────────────────────────────

    public function test_sale_with_a_composition_return_cannot_be_deleted(): void
    {
        [$sale] = $this->soldFacial();
        $admin = $this->admin();
        $this->complete($this->returnData($sale, 1));

        $this->expectException(\Throwable::class);
        app(RecordLifecycleService::class)->delete($sale->fresh(), 'test', $admin);
    }

    // ─── HTTP / authorization ─────────────────────────────────

    public function test_salesman_cannot_create_or_process_a_composition_return(): void
    {
        [$sale, $serum] = $this->soldFacial();
        $salesman = $this->salesman();
        $runItem = CompositionRun::firstOrFail()->items()->firstOrFail();

        $payload = $this->httpPayload($sale, 1, [
            ['composition_run_item_id' => (int) $runItem->id, 'quantity' => 5],
        ]);

        $this->actingAs($salesman)->post('/returns/sale', $payload)->assertForbidden();

        $this->assertSame(0, ReturnModel::count());
        $this->assertSame(95.0, (float) $serum->fresh()->stock_quantity);
    }

    public function test_admin_can_create_and_complete_a_composition_return_over_http(): void
    {
        [$sale, $serum] = $this->soldFacial();
        $admin = $this->admin();
        $runItem = CompositionRun::firstOrFail()->items()->firstOrFail();

        $response = $this->actingAs($admin)->post('/returns/sale', $this->httpPayload($sale, 1, [
            ['composition_run_item_id' => (int) $runItem->id, 'quantity' => 5],
        ], 'http-ret-'.uniqid()));

        $return = ReturnModel::firstOrFail();
        $response->assertRedirect(route('returns.show', $return->id));

        // Nothing is restored until the return is completed.
        $this->assertSame(95.0, (float) $serum->fresh()->stock_quantity);
        $this->assertSame('pending', $return->status);
        $this->assertSame(1, ReturnComponentRecovery::count());
        $this->assertNull(ReturnComponentRecovery::firstOrFail()->restored_at);

        $this->actingAs($admin)->post("/returns/{$return->id}/complete")->assertRedirect();

        $this->assertSame(100.0, (float) $serum->fresh()->stock_quantity);
        $this->assertSame('completed', $return->fresh()->status);
    }

    public function test_forged_recovered_quantity_is_rejected_over_http(): void
    {
        [$sale] = $this->soldFacial();
        $admin = $this->admin();
        $runItem = CompositionRun::firstOrFail()->items()->firstOrFail();

        $this->actingAs($admin)
            ->from('/returns/sale')
            ->post('/returns/sale', $this->httpPayload($sale, 1, [
                ['composition_run_item_id' => (int) $runItem->id, 'quantity' => 999],
            ]))
            ->assertRedirect('/returns/sale')
            ->assertSessionHasErrors('items');

        $this->assertSame(0, ReturnModel::count());
        $this->assertSame(0, ReturnComponentRecovery::count());
    }

    /**
     * @param  array<int, array{composition_run_item_id: int, quantity: float}>  $recoveries
     */
    private function httpPayload(Sale $sale, float $quantity, array $recoveries = [], ?string $key = null): array
    {
        $saleItem = $sale->items()->firstOrFail();

        return array_filter([
            'idempotency_key' => $key,
            'reference_id' => $sale->id,
            'reference_type' => 'sale',
            'return_date' => '2026-11-16',
            'contact_id' => $sale->customer_id,
            'items' => [[
                'reference_item_id' => $saleItem->id,
                'reference_item_type' => 'sale_item',
                'product_id' => $saleItem->product_id,
                'product_name' => $saleItem->product_name,
                'selling_unit_id' => $saleItem->selling_unit_id,
                'packaging_name' => $saleItem->packaging_name,
                'quantity' => $quantity,
                'base_quantity' => $quantity,
                'unit_price' => $saleItem->unit_price,
                'total' => $quantity * (float) $saleItem->unit_price,
                'restock' => true,
                'material_recoveries' => $recoveries,
            ]],
            'subtotal' => $quantity * (float) $saleItem->unit_price,
            'discount' => 0,
            'grand_total' => $quantity * (float) $saleItem->unit_price,
            'refund_amount' => $quantity * (float) $saleItem->unit_price,
            'refund_method' => 'cash',
        ], fn ($value) => $value !== null);
    }
}
