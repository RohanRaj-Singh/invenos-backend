<?php

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Services\InventoryService;
use App\Models\InventoryTransaction;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ConsumptionTest extends TestCase
{
    use RefreshDatabase;

    private function product(float $stock, bool $allowNegative = false, float $threshold = 5): Product
    {
        return Product::create([
            'name' => 'Consumable '.uniqid(),
            'sku' => 'CON-'.uniqid(),
            'base_unit_id' => 'ml',
            'stock_quantity' => $stock,
            'low_stock_threshold' => $threshold,
            'allow_negative_stock' => $allowNegative,
            'track_inventory' => true,
            'status' => 'in-stock',
        ]);
    }

    public function test_record_consumption_writes_a_negative_ledger_movement(): void
    {
        $product = $this->product(10);
        $service = app(InventoryService::class);

        $movement = $service->recordConsumption(
            productId: $product->id,
            quantity: 3,
            reference: 'TEST-CON-1',
            user: 'tester',
            unitCost: 2.5,
        );

        $product->refresh();

        $this->assertSame('consumption', $movement->type);
        $this->assertSame(-3.0, (float) $movement->quantity);
        $this->assertSame(7.0, (float) $movement->running_balance);
        $this->assertSame(7.0, (float) $product->stock_quantity);
        $this->assertSame('in-stock', $product->status);
        $this->assertSame(1, InventoryTransaction::where('product_id', $product->id)->count());
    }

    public function test_consumption_recomputes_status_through_low_and_out_of_stock(): void
    {
        $product = $this->product(10, threshold: 5);
        $service = app(InventoryService::class);

        $service->recordConsumption($product->id, 6, reference: 'TEST-CON-2');
        $this->assertSame('low-stock', $product->fresh()->status);

        $service->recordConsumption($product->id, 4, reference: 'TEST-CON-3');
        $product->refresh();

        $this->assertSame(0.0, (float) $product->stock_quantity);
        $this->assertSame('out-of-stock', $product->status);
    }

    public function test_insufficient_consumption_is_rejected_without_a_movement(): void
    {
        $product = $this->product(2);
        $service = app(InventoryService::class);

        try {
            $service->recordConsumption($product->id, 3, reference: 'TEST-CON-4');
            $this->fail('Consumption beyond available stock should have failed.');
        } catch (\InvalidArgumentException $e) {
            $this->assertStringContainsString('Insufficient stock', $e->getMessage());
        }

        $this->assertSame(2.0, (float) $product->fresh()->stock_quantity);
        $this->assertSame(0, InventoryTransaction::where('product_id', $product->id)->count());
    }

    public function test_multiple_consumptions_roll_back_when_a_later_one_fails(): void
    {
        $first = $this->product(10);
        $second = $this->product(1);
        $service = app(InventoryService::class);

        try {
            DB::transaction(function () use ($service, $first, $second) {
                $service->recordConsumption($first->id, 2, reference: 'TEST-CON-5');
                $service->recordConsumption($second->id, 5, reference: 'TEST-CON-6');
            });
            $this->fail('The transaction should have failed on the second component.');
        } catch (\InvalidArgumentException $e) {
            $this->assertStringContainsString('Insufficient stock', $e->getMessage());
        }

        $this->assertSame(10.0, (float) $first->fresh()->stock_quantity);
        $this->assertSame(1.0, (float) $second->fresh()->stock_quantity);
        $this->assertSame(0, InventoryTransaction::count());
    }

    public function test_consumption_quantity_must_be_positive(): void
    {
        $product = $this->product(10);

        $this->expectException(\InvalidArgumentException::class);

        app(InventoryService::class)->recordConsumption($product->id, 0, reference: 'TEST-CON-7');
    }
}
