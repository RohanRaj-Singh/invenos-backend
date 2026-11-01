<?php

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Services\CostResolver;
use App\Domains\Purchasing\DTOs\CreatePurchaseData;
use App\Domains\Purchasing\DTOs\PurchaseItemData;
use App\Domains\Purchasing\Services\PurchaseService;
use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\DTOs\SaleItemData;
use App\Domains\Sales\Services\SaleService;
use App\Models\Contact;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\SellingUnit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CostingTest extends TestCase
{
    use RefreshDatabase;

    private Product $product;
    private Contact $supplier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->product = Product::create([
            'name' => 'Capsule', 'sku' => 'CAP-C1', 'base_unit_id' => 'capsule',
            'track_inventory' => true, 'stock_quantity' => 0, 'status' => 'out-of-stock',
            'created_by' => 'test',
        ]);

        $this->supplier = Contact::create([
            'name' => 'Supplier', 'phone' => '0300-9', 'roles' => ['supplier'],
            'type' => 'person', 'opening_balance' => 0, 'current_balance' => 0,
        ]);
    }

    private function purchase(float $packCost, float $packs = 1, float $packQty = 100): void
    {
        app(PurchaseService::class)->create(new CreatePurchaseData(
            invoiceRef: 'PUR-' . uniqid(),
            supplierId: $this->supplier->id,
            date: '2026-10-01',
            items: [PurchaseItemData::fromArray([
                'product_id' => $this->product->id,
                'product_name' => 'Capsule',
                'purchase_pack_qty' => $packQty,
                'purchase_quantity' => $packs,
                'unit_cost' => $packCost,
                'total_cost' => $packCost * $packs,
            ])],
            discount: 0,
            amountPaid: 0,
            paymentMethod: 'cash',
            paymentStatus: 'unpaid',
            status: 'received',
            notes: null,
            createdBy: 'test',
        ));
    }

    public function test_pack_cost_is_converted_to_base_unit_cost(): void
    {
        $this->purchase(750);

        $this->assertSame(7.5, (float) $this->product->fresh()->average_cost);
        $this->assertDatabaseHas('purchase_bill_items', [
            'product_id' => $this->product->id, 'unit_cost_base' => 7.5,
        ]);

        $movement = InventoryTransaction::where('product_id', $this->product->id)
            ->where('type', 'purchase')->first();
        $this->assertSame(7.5, (float) $movement->unit_cost);
        $this->assertSame(100.0, (float) $movement->quantity);
    }

    public function test_second_purchase_moves_the_weighted_average(): void
    {
        $this->purchase(750);   // 100 @ 7.50
        $this->purchase(850);   // 100 @ 8.50

        $this->assertSame(8.0, (float) $this->product->fresh()->average_cost);
        $this->assertSame(200.0, (float) $this->product->fresh()->stock_quantity);
    }

    public function test_sale_snapshots_the_average_into_cogs(): void
    {
        $this->purchase(750);
        $this->purchase(850);

        $sale = app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-C1',
            customerId: 0,
            customerName: 'Walk-in',
            date: '2026-10-05',
            items: [SaleItemData::fromArray([
                'product_id' => $this->product->id,
                'product_name' => 'Capsule',
                'quantity' => 10,
                'base_unit_quantity' => 1,
                'base_quantity' => 10,
                'unit_price' => 20,
                'total' => 200,
            ])],
            discount: 0,
            amountPaid: 200,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'test',
        ));

        $this->assertSame(8.0, (float) $sale->items()->first()->cost_price);

        $movement = InventoryTransaction::where('product_id', $this->product->id)
            ->where('type', 'sale')->first();
        $this->assertSame(8.0, (float) $movement->unit_cost);
    }

    public function test_opening_stock_is_not_blended_into_the_purchase_cost(): void
    {
        $this->product->update(['stock_quantity' => 100]); // 100 uncosted units

        $this->purchase(750); // 100 @ 7.50

        $product = $this->product->fresh();
        $this->assertSame(7.5, (float) $product->average_cost);
        $this->assertSame(100.0, (float) $product->uncosted_qty);
        $this->assertSame(200.0, (float) $product->stock_quantity);
    }

    public function test_sale_consumes_uncosted_stock_first(): void
    {
        $this->product->update(['stock_quantity' => 100]);
        $this->purchase(750);

        app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-UNC',
            customerId: 0,
            customerName: 'Walk-in',
            date: '2026-10-06',
            items: [SaleItemData::fromArray([
                'product_id' => $this->product->id,
                'product_name' => 'Capsule',
                'quantity' => 60,
                'base_unit_quantity' => 1,
                'base_quantity' => 60,
                'unit_price' => 20,
                'total' => 1200,
            ])],
            discount: 0,
            amountPaid: 1200,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'test',
        ));

        $this->assertSame(40.0, (float) $this->product->fresh()->uncosted_qty);
    }

    public function test_legacy_pack_cost_is_divided_by_the_selling_unit(): void
    {
        $product = Product::create([
            'name' => 'Strip', 'sku' => 'STR-1', 'base_unit_id' => 'capsule',
            'track_inventory' => true, 'stock_quantity' => 500,
            'default_purchase_cost' => 750, 'status' => 'in-stock', 'created_by' => 'test',
        ]);

        SellingUnit::create([
            'product_id' => $product->id, 'name' => 'Box', 'unit_id' => 'box',
            'quantity' => 100, 'sale_price' => 900, 'is_default' => true,
        ]);

        $this->assertSame(7.5, app(CostResolver::class)->unitCost($product->fresh()));
        $this->assertSame('estimated', app(CostResolver::class)->costBasis($product->fresh()));
    }

    public function test_cost_is_null_when_no_evidence_exists(): void
    {
        $this->assertNull(app(CostResolver::class)->unitCost($this->product->fresh()));
        $this->assertSame('unavailable', app(CostResolver::class)->costBasis($this->product->fresh()));
    }

    public function test_opening_cost_is_used_before_legacy_columns(): void
    {
        $product = Product::create([
            'name' => 'Herb', 'sku' => 'HRB-1', 'base_unit_id' => 'g',
            'track_inventory' => true, 'stock_quantity' => 100,
            'opening_cost' => 2.5, 'default_purchase_cost' => 900,
            'status' => 'in-stock', 'created_by' => 'test',
        ]);

        $this->assertSame(2.5, app(CostResolver::class)->unitCost($product));
        $this->assertSame('exact', app(CostResolver::class)->costBasis($product));
    }
}
