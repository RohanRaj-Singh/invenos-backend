<?php

namespace Tests\Feature\Composition;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Composition\Services\CompositionService;
use App\Domains\Returns\DTOs\ReturnCreateData;
use App\Domains\Returns\DTOs\ReturnItemData;
use App\Domains\Returns\Services\ReturnService;
use App\Models\AuditLog;
use App\Models\CompositionRun;
use App\Models\Contact;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SellingUnit;
use App\Models\User;
use App\Services\Lifecycle\RecordLifecycleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CompositionPosIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'active' => true]);
    }

    private function salesman(): User
    {
        return User::factory()->create(['role' => 'salesman', 'active' => true]);
    }

    private function customer(): Contact
    {
        return Contact::create([
            'type' => 'person',
            'roles' => ['customer'],
            'name' => 'POS Customer',
            'phone' => '0300-'.random_int(1000000, 9999999),
        ]);
    }

    private function product(
        string $name,
        string $unit = 'piece',
        float $stock = 100,
        bool $track = true,
        float $price = 100,
        float $sellingFactor = 1,
        string $sellingName = 'Single',
    ): Product {
        $product = Product::create([
            'name' => $name.' '.uniqid(),
            'sku' => 'P4-'.uniqid(),
            'base_unit_id' => $unit,
            'track_inventory' => $track,
            'stock_quantity' => $stock,
            'status' => $stock > 0 ? 'in-stock' : 'out-of-stock',
            'allow_negative_stock' => false,
            'location' => 'Main store',
        ]);

        SellingUnit::create([
            'product_id' => $product->id,
            'name' => $sellingName,
            'unit_id' => $unit,
            'quantity' => $sellingFactor,
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
            name: 'POS formula',
            outputQuantity: 1,
            outputUnitId: $parent->base_unit_id,
        ), 'tester');
    }

    /**
     * @param  array<int, array{product: Product, quantity: float, unit_price?: float}>  $lines
     */
    private function payload(
        array $lines,
        ?string $idempotencyKey = null,
        float $discount = 0,
        bool $bypassStock = false,
        ?Contact $customer = null,
    ): array {
        $customer ??= $this->customer();

        $items = array_map(function (array $line) {
            $product = $line['product'];
            $sellingUnit = $product->sellingUnits()->first();
            $quantity = (float) $line['quantity'];
            $unitPrice = (float) ($line['unit_price'] ?? $sellingUnit->sale_price);

            return [
                'product_id' => $product->id,
                'quantity' => $quantity,
                'packaging_quantity' => $quantity,
                'packaging_name' => $sellingUnit->name,
                'selling_unit_id' => $sellingUnit->id,
                // Deliberately untrusted values; the server must derive these.
                'base_unit_quantity' => 999,
                'base_quantity' => 999,
                'unit_price' => $unitPrice,
                'total' => $quantity * $unitPrice,
            ];
        }, $lines);

        $subtotal = array_sum(array_column($items, 'total'));

        return array_filter([
            'idempotency_key' => $idempotencyKey,
            'items' => $items,
            'customer_id' => $customer->id,
            'discount' => $discount,
            'amount_paid' => max(0, $subtotal - $discount),
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'source' => 'pos',
            'date' => now()->format('Y-m-d'),
            'bypass_stock_check' => $bypassStock ?: null,
        ], fn ($value) => $value !== null);
    }

    public function test_consumption_sale_creates_one_commercial_line_and_consumes_components(): void
    {
        $admin = $this->admin();
        $parent = $this->product('Facial Service', 'piece', 50, price: 1500);
        $component = $this->product('Serum', 'ml');
        $composition = $this->composition($parent, [$this->item($component, 5)]);

        $response = $this->actingAs($admin)->post('/sales', $this->payload([
            ['product' => $parent, 'quantity' => 2, 'unit_price' => 1500],
        ], 'p4-success-'.uniqid()));

        $response->assertRedirect();

        $sale = Sale::with('items')->firstOrFail();
        $this->assertCount(1, $sale->items);
        $this->assertSame($parent->id, $sale->items->first()->product_id);
        $this->assertSame(0, SaleItem::where('product_id', $component->id)->count());

        $this->assertSame(50.0, (float) $parent->fresh()->stock_quantity);
        $this->assertSame(90.0, (float) $component->fresh()->stock_quantity);
        $this->assertSame(0, InventoryTransaction::where('product_id', $parent->id)->count());

        $run = CompositionRun::with('items')->firstOrFail();
        $this->assertSame('sale', $run->source_type);
        $this->assertSame($sale->id, $run->source_id);
        $this->assertSame($sale->items->first()->id, $run->sale_item_id);
        $this->assertSame($sale->invoice_number, $run->reference);
        $this->assertSame($composition->id, $run->composition_id);
        $this->assertSame(2.0, (float) $run->quantity);
        $this->assertSame(10.0, (float) $run->items->first()->actual_quantity);
        $this->assertSame('consumption', InventoryTransaction::where('product_id', $component->id)->first()->type);
        $this->assertSame($sale->items->first()->id, $run->saleItem->id);
        $this->assertSame(1, $sale->compositionRuns()->count());
        $this->assertDatabaseHas('audit_logs', [
            'event' => 'composition.executed',
            'auditable_id' => $run->id,
        ]);
        $this->assertSame(1, AuditLog::where('event', 'composition.executed')->count());
    }

    public function test_selling_unit_factor_is_used_for_composition_quantity(): void
    {
        $parent = $this->product('Massage Service', 'piece', 50, price: 1000, sellingFactor: 10, sellingName: 'Box');
        $component = $this->product('Oil', 'ml');
        $this->composition($parent, [$this->item($component, 2)]);

        $this->actingAs($this->admin())->post('/sales', $this->payload([
            ['product' => $parent, 'quantity' => 2, 'unit_price' => 1000],
        ], 'p4-unit-'.uniqid()))->assertRedirect();

        $saleItem = SaleItem::firstOrFail();
        $run = CompositionRun::firstOrFail();

        $this->assertSame(20.0, (float) $saleItem->base_quantity);
        $this->assertSame(10.0, (float) $saleItem->base_unit_quantity);
        $this->assertSame(20.0, (float) $run->quantity);
        $this->assertSame(60.0, (float) $component->fresh()->stock_quantity);
        $this->assertSame(50.0, (float) $parent->fresh()->stock_quantity);
    }

    public function test_wastage_and_component_cost_are_snapshotted(): void
    {
        $parent = $this->product('Treatment', 'piece', 50, price: 1500);
        $component = $this->product('Serum', 'ml');
        $component->update(['average_cost' => 2.5]);
        $this->composition($parent, [$this->item($component, 10, 10)]);

        $this->actingAs($this->admin())->post('/sales', $this->payload([
            ['product' => $parent, 'quantity' => 2, 'unit_price' => 1500],
        ], 'p4-wastage-'.uniqid()))->assertRedirect();

        $run = CompositionRun::with('items')->firstOrFail();
        $runItem = $run->items->first();

        $this->assertSame(78.0, (float) $component->fresh()->stock_quantity);
        $this->assertSame(22.0, (float) $runItem->actual_quantity);
        $this->assertSame(20.0, (float) $runItem->template_quantity);
        $this->assertSame(10.0, (float) $runItem->wastage_pct);
        $this->assertSame(2.5, $runItem->unit_cost);
        $this->assertSame(55.0, $runItem->total_cost);
        $this->assertSame(55.0, $run->total_cost);
        $this->assertSame('exact', $run->cost_basis);
    }

    public function test_multiple_composition_lines_consume_shared_components_cumulatively(): void
    {
        $raw = $this->product('Shared raw', 'ml');
        $first = $this->product('Service A', 'piece', 10, price: 500);
        $second = $this->product('Service B', 'piece', 10, price: 700);

        $this->composition($first, [$this->item($raw, 5)]);
        $this->composition($second, [$this->item($raw, 7)]);

        $this->actingAs($this->admin())->post('/sales', $this->payload([
            ['product' => $first, 'quantity' => 1],
            ['product' => $second, 'quantity' => 1],
        ], 'p4-multi-'.uniqid()))->assertRedirect();

        $sale = Sale::with('items')->firstOrFail();
        $runs = CompositionRun::orderBy('id')->get();

        $this->assertCount(2, $sale->items);
        $this->assertCount(2, $runs);
        $this->assertSame(88.0, (float) $raw->fresh()->stock_quantity);
        $this->assertSame(10.0, (float) $first->fresh()->stock_quantity);
        $this->assertSame(10.0, (float) $second->fresh()->stock_quantity);
        $this->assertCount(2, $runs->pluck('idempotency_key')->unique());
        $this->assertSame(
            [$sale->items[0]->id, $sale->items[1]->id],
            $runs->pluck('sale_item_id')->sort()->values()->all(),
        );
        $this->assertSame(2, InventoryTransaction::where('product_id', $raw->id)->where('type', 'consumption')->count());
    }

    public function test_shared_component_shortage_rejects_the_whole_sale_without_partial_consumption(): void
    {
        $raw = $this->product('Scarce raw', 'ml', 11);
        $first = $this->product('Service A', 'piece', 10);
        $second = $this->product('Service B', 'piece', 10);
        $this->composition($first, [$this->item($raw, 5)]);
        $this->composition($second, [$this->item($raw, 7)]);

        $response = $this->from('/sales/pos')->actingAs($this->admin())->post('/sales', $this->payload([
            ['product' => $first, 'quantity' => 1],
            ['product' => $second, 'quantity' => 1],
        ], 'p4-shortage-'.uniqid()));

        $response->assertRedirect('/sales/pos')->assertSessionHasErrors('items');
        $this->assertSame(0, Sale::count());
        $this->assertSame(0, SaleItem::count());
        $this->assertSame(0, CompositionRun::count());
        $this->assertSame(0, InventoryTransaction::count());
        $this->assertSame(11.0, (float) $raw->fresh()->stock_quantity);
    }

    public function test_simple_line_movement_rolls_back_when_a_composition_fails(): void
    {
        $simple = $this->product('Simple product', 'piece', 100);
        $service = $this->product('Service', 'piece', 10);
        $component = $this->product('Scarce component', 'ml', 1);
        $this->composition($service, [$this->item($component, 5)]);

        $response = $this->from('/sales/pos')->actingAs($this->admin())->post('/sales', $this->payload([
            ['product' => $simple, 'quantity' => 2],
            ['product' => $service, 'quantity' => 1],
        ], 'p4-atomic-'.uniqid()));

        $response->assertRedirect('/sales/pos')->assertSessionHasErrors('items');
        $this->assertSame(100.0, (float) $simple->fresh()->stock_quantity);
        $this->assertSame(1.0, (float) $component->fresh()->stock_quantity);
        $this->assertSame(0, Sale::count());
        $this->assertSame(0, InventoryTransaction::count());
        $this->assertSame(0, CompositionRun::count());
    }

    public function test_bypass_stock_check_does_not_bypass_component_validation(): void
    {
        $service = $this->product('Service', 'piece', 10);
        $component = $this->product('Component', 'ml', 1);
        $this->composition($service, [$this->item($component, 5)]);

        $response = $this->from('/sales/pos')->actingAs($this->admin())->post('/sales', $this->payload([
            ['product' => $service, 'quantity' => 1],
        ], 'p4-bypass-'.uniqid(), bypassStock: true));

        $response->assertRedirect('/sales/pos')->assertSessionHasErrors('items');
        $this->assertSame(0, Sale::count());
        $this->assertSame(0, CompositionRun::count());
        $this->assertSame(1.0, (float) $component->fresh()->stock_quantity);
    }

    public function test_sale_idempotency_retry_does_not_repeat_composition(): void
    {
        $admin = $this->admin();
        $service = $this->product('Service', 'piece', 10, price: 1000);
        $component = $this->product('Component', 'ml');
        $this->composition($service, [$this->item($component, 5)]);
        $payload = $this->payload([
            ['product' => $service, 'quantity' => 2],
        ], 'p4-retry-'.uniqid());

        $this->actingAs($admin)->post('/sales', $payload)->assertRedirect();
        $sale = Sale::firstOrFail();

        $this->actingAs($admin)->post('/sales', $payload)
            ->assertRedirect(route('sales.show', $sale->id));

        $this->assertSame(1, Sale::count());
        $this->assertSame(1, CompositionRun::count());
        $this->assertSame(90.0, (float) $component->fresh()->stock_quantity);
        $this->assertSame(10.0, (float) $service->fresh()->stock_quantity);
    }

    public function test_discount_and_price_override_do_not_change_component_consumption(): void
    {
        $service = $this->product('Service', 'piece', 10, price: 1000);
        $component = $this->product('Component', 'ml');
        $this->composition($service, [$this->item($component, 5)]);

        $this->actingAs($this->admin())->post('/sales', $this->payload([
            ['product' => $service, 'quantity' => 2, 'unit_price' => 1],
        ], 'p4-price-'.uniqid(), discount: 1))->assertRedirect();

        $sale = Sale::firstOrFail();
        $this->assertSame(2.0, (float) $sale->subtotal);
        $this->assertSame(1.0, (float) $sale->discount);
        $this->assertSame(1.0, (float) $sale->grand_total);
        $this->assertSame(90.0, (float) $component->fresh()->stock_quantity);
        $this->assertSame(10.0, (float) CompositionRun::firstOrFail()->items()->first()->actual_quantity);
    }

    public function test_simple_and_assembly_products_keep_existing_sale_behavior(): void
    {
        $simple = $this->product('Simple', 'piece', 100);
        $assembly = $this->product('Assembly', 'piece', 100, price: 500);
        $raw = $this->product('Assembly raw', 'ml');
        $this->composition($assembly, [$this->item($raw, 5)], ProductComposition::KIND_ASSEMBLY);

        $this->actingAs($this->admin())->post('/sales', $this->payload([
            ['product' => $simple, 'quantity' => 2],
            ['product' => $assembly, 'quantity' => 2],
        ], 'p4-simple-assembly-'.uniqid()))->assertRedirect();

        $this->assertSame(98.0, (float) $simple->fresh()->stock_quantity);
        $this->assertSame(98.0, (float) $assembly->fresh()->stock_quantity);
        $this->assertSame(100.0, (float) $raw->fresh()->stock_quantity);
        $this->assertSame(0, CompositionRun::count());
        $this->assertSame(2, InventoryTransaction::where('type', 'sale')->count());
    }

    public function test_composition_sale_deletion_stays_blocked_while_returns_are_allowed_without_restoration(): void
    {
        $admin = $this->admin();
        $service = $this->product('Service', 'piece', 10, price: 1000);
        $component = $this->product('Component', 'ml');
        $this->composition($service, [$this->item($component, 5)]);

        $this->actingAs($admin)->post('/sales', $this->payload([
            ['product' => $service, 'quantity' => 1],
        ], 'p4-guard-'.uniqid()))->assertRedirect();

        $sale = Sale::with('items')->firstOrFail();
        $saleItem = $sale->items->first();

        try {
            app(RecordLifecycleService::class)->delete($sale, 'test', $admin);
            $this->fail('Composition sale deletion stays blocked after P6.');
        } catch (\Throwable $exception) {
            $this->assertStringContainsString('composition components', $exception->getMessage());
        }

        $this->assertNotSoftDeleted($sale);
        $this->assertSame(1, CompositionRun::count());

        $returnData = new ReturnCreateData(
            type: 'SALE',
            referenceId: $sale->id,
            referenceType: 'sale',
            returnNumber: 'SR-'.uniqid(),
            returnDate: now()->format('Y-m-d'),
            contactId: $sale->customer_id ?? 0,
            contactName: $sale->customer_name,
            reasonId: null,
            reasonNote: null,
            items: [new ReturnItemData(
                referenceItemId: $saleItem->id,
                referenceItemType: 'sale_item',
                productId: $service->id,
                productName: $service->name,
                sellingUnitId: $saleItem->selling_unit_id,
                packagingName: $saleItem->packaging_name,
                quantity: 1,
                baseQuantity: 1,
                unitPrice: 1000,
                total: 1000,
                reasonId: null,
                notes: null,
                restock: true,
            )],
            subtotal: 1000,
            discount: 0,
            grandTotal: 1000,
            refundAmount: 1000,
            refundMethod: 'cash',
            notes: null,
            createdBy: $admin->name,
        );

        // P6: the commercial return is allowed, but a refund alone restores no
        // component inventory.
        app(ReturnService::class)->validate($returnData);

        $return = app(ReturnService::class)->createReturn($returnData);
        app(ReturnService::class)->completeReturn($return->id);

        $this->assertSame(95.0, (float) $component->fresh()->stock_quantity);
        $this->assertSame(1, CompositionRun::count());
        $this->assertSame(0, InventoryTransaction::where('type', 'sale-return')->count());
    }

    public function test_active_composition_version_is_used_and_prior_runs_are_preserved(): void
    {
        $admin = $this->admin();
        $service = $this->product('Versioned service', 'piece', 10, price: 1000);
        $component = $this->product('Versioned component', 'ml');
        $v1 = $this->composition($service, [$this->item($component, 5)]);

        $this->actingAs($admin)->post('/sales', $this->payload([
            ['product' => $service, 'quantity' => 1],
        ], 'p4-version-1-'.uniqid()))->assertRedirect();

        $v2 = app(CompositionService::class)->save(new SaveCompositionData(
            productId: $service->id,
            kind: ProductComposition::KIND_CONSUMPTION,
            items: [$this->item($component, 8)],
            name: 'POS formula v2',
            outputQuantity: 1,
            outputUnitId: $service->base_unit_id,
        ), 'tester');

        $this->actingAs($admin)->post('/sales', $this->payload([
            ['product' => $service, 'quantity' => 1],
        ], 'p4-version-2-'.uniqid()))->assertRedirect();

        $runs = CompositionRun::orderBy('id')->get();
        $this->assertCount(2, $runs);
        $this->assertSame($v1->id, $runs[0]->composition_id);
        $this->assertSame($v2->id, $runs[1]->composition_id);
        $this->assertSame([1, 2], $runs->pluck('template_version')->all());
        $this->assertSame(5.0, (float) $runs[0]->items()->first()->actual_quantity);
        $this->assertSame(8.0, (float) $runs[1]->items()->first()->actual_quantity);
        $this->assertSame(87.0, (float) $component->fresh()->stock_quantity);
    }

    public function test_composition_line_without_selling_unit_uses_base_units_not_client_quantity(): void
    {
        $service = $this->product('No-unit service', 'piece', 10, price: 1000);
        $component = $this->product('No-unit component', 'ml');
        $this->composition($service, [$this->item($component, 2)]);

        $payload = $this->payload([
            ['product' => $service, 'quantity' => 1],
        ], 'p4-no-unit-'.uniqid());
        unset($payload['items'][0]['selling_unit_id']);
        $payload['items'][0]['base_unit_quantity'] = 999;
        $payload['items'][0]['base_quantity'] = 999;

        $this->actingAs($this->admin())->post('/sales', $payload)->assertRedirect();

        $this->assertSame(1.0, (float) SaleItem::firstOrFail()->base_quantity);
        $this->assertSame(1.0, (float) CompositionRun::firstOrFail()->quantity);
        $this->assertSame(98.0, (float) $component->fresh()->stock_quantity);
    }

    public function test_admin_and_salesman_can_checkout_but_inactive_and_guest_cannot(): void
    {
        $service = $this->product('Service', 'piece', 10);
        $component = $this->product('Component', 'ml');
        $this->composition($service, [$this->item($component, 5)]);

        $this->actingAs($this->salesman())->post('/sales', $this->payload([
            ['product' => $service, 'quantity' => 1],
        ], 'p4-salesman-'.uniqid()))->assertRedirect();
        $this->assertSame(1, Sale::count());

        $inactive = User::factory()->create(['role' => 'salesman', 'active' => false]);
        $this->actingAs($inactive)->post('/sales', $this->payload([
            ['product' => $service, 'quantity' => 1],
        ], 'p4-inactive-'.uniqid()))->assertForbidden();

        Auth::logout();

        $this->post('/sales', $this->payload([
            ['product' => $service, 'quantity' => 1],
        ], 'p4-guest-'.uniqid()))->assertRedirect('/login');

        $this->assertSame(1, Sale::count());
        $this->assertSame(1, CompositionRun::count());
    }

    public function test_pos_product_props_expose_consumption_capability_without_components(): void
    {
        $service = $this->product('A Service', 'piece', 10);
        $simple = $this->product('B Simple', 'piece', 10);
        $component = $this->product('Component', 'ml');
        $this->composition($service, [$this->item($component, 5)]);

        $this->actingAs($this->admin())->get('/sales/pos')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('pos/SaleBill')
                ->has('products', 3)
                ->where('products.0.has_consumption_composition', true)
                ->where('products.0.consumption_composition_version', 1)
                ->where('products.1.has_consumption_composition', false)
                ->where('products.2.has_consumption_composition', false));
    }
}
