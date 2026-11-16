<?php

namespace Tests\Feature\Composition;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Composition\Services\CompositionService;
use App\Models\AuditLog;
use App\Models\CompositionRun;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompositionExecutionApiTest extends TestCase
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

    private function product(string $name = 'Product', string $unit = 'piece', float $stock = 100): Product
    {
        return Product::create([
            'name' => $name.' '.uniqid(),
            'sku' => 'API-'.uniqid(),
            'base_unit_id' => $unit,
            'track_inventory' => true,
            'stock_quantity' => $stock,
            'status' => $stock > 0 ? 'in-stock' : 'out-of-stock',
            // These tests assert stock protection, so the policy is explicit
            // rather than inherited from the model default.
            'allow_negative_stock' => false,
        ]);
    }

    private function composition(Product $product, Product $component, float $quantity = 5): ProductComposition
    {
        return app(CompositionService::class)->save(new SaveCompositionData(
            productId: $product->id,
            kind: ProductComposition::KIND_CONSUMPTION,
            items: [new CompositionItemData(
                componentProductId: $component->id,
                quantityBase: $quantity,
                displayUnitId: $component->base_unit_id,
            )],
            name: 'API formula',
            outputQuantity: 1,
            outputUnitId: $product->base_unit_id,
        ), 'tester');
    }

    public function test_admin_can_execute_a_composition_through_the_manual_endpoint(): void
    {
        $admin = $this->admin();
        $product = $this->product('Service');
        $component = $this->product('Component', 'ml');
        $composition = $this->composition($product, $component);

        $response = $this->actingAs($admin)->postJson(
            route('inventory.composition.execute', [$product, $composition]),
            [
                'quantity' => 2,
                'reference' => 'MANUAL-1',
                'source_type' => 'manual',
            ],
        );

        $response->assertCreated()
            ->assertJsonPath('data.status', CompositionRun::STATUS_COMPLETED)
            ->assertJsonPath('data.quantity', 2)
            ->assertJsonPath('data.reference', 'MANUAL-1')
            ->assertJsonCount(1, 'data.items');

        $this->assertSame(90.0, (float) $component->fresh()->stock_quantity);
        $this->assertSame(1, CompositionRun::count());
        $this->assertSame(1, InventoryTransaction::where('type', 'consumption')->count());
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'event' => 'composition.executed',
            'auditable_type' => CompositionRun::class,
        ]);
    }

    public function test_salesman_and_guests_cannot_execute_a_composition(): void
    {
        $product = $this->product('Service');
        $component = $this->product('Component', 'ml');
        $composition = $this->composition($product, $component);
        $url = route('inventory.composition.execute', [$product, $composition]);

        $this->actingAs($this->salesman())
            ->postJson($url, ['quantity' => 1])
            ->assertForbidden();

        $this->postJson($url, ['quantity' => 1])->assertForbidden();

        $this->assertSame(100.0, (float) $component->fresh()->stock_quantity);
        $this->assertSame(0, CompositionRun::count());
    }

    public function test_insufficient_stock_returns_a_structured_validation_error(): void
    {
        $admin = $this->admin();
        $product = $this->product('Service');
        $component = $this->product('Component', 'ml', 1);
        $composition = $this->composition($product, $component);

        $response = $this->actingAs($admin)->postJson(
            route('inventory.composition.execute', [$product, $composition]),
            ['quantity' => 2],
        );

        $response->assertStatus(422)
            ->assertJsonPath('component.component_product_id', $component->id)
            ->assertJsonPath('component.required_quantity', 10)
            ->assertJsonPath('component.available_quantity', 1);

        $this->assertSame(1.0, (float) $component->fresh()->stock_quantity);
        $this->assertSame(0, CompositionRun::count());
        $this->assertSame(0, InventoryTransaction::where('type', 'consumption')->count());
    }

    public function test_endpoint_validates_quantity_and_composition_ownership(): void
    {
        $admin = $this->admin();
        $product = $this->product('Service');
        $component = $this->product('Component', 'ml');
        $composition = $this->composition($product, $component);

        $this->actingAs($admin)->postJson(
            route('inventory.composition.execute', [$product, $composition]),
            ['quantity' => 0],
        )->assertUnprocessable();

        $otherProduct = $this->product('Other service');

        $this->actingAs($admin)->postJson(
            route('inventory.composition.execute', [$otherProduct, $composition]),
            ['quantity' => 1],
        )->assertNotFound();

        $this->assertSame(0, CompositionRun::count());
    }

    public function test_idempotency_header_prevents_double_consumption_through_the_endpoint(): void
    {
        $admin = $this->admin();
        $product = $this->product('Service');
        $component = $this->product('Component', 'ml');
        $composition = $this->composition($product, $component);
        $url = route('inventory.composition.execute', [$product, $composition]);

        $first = $this->actingAs($admin)
            ->withHeader('Idempotency-Key', 'http-key-1')
            ->postJson($url, ['quantity' => 2])
            ->assertCreated();

        $second = $this->actingAs($admin)
            ->withHeader('Idempotency-Key', 'http-key-1')
            ->postJson($url, ['quantity' => 2])
            ->assertOk();

        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $this->assertSame(90.0, (float) $component->fresh()->stock_quantity);
        $this->assertSame(1, CompositionRun::count());
        $this->assertSame(1, AuditLog::where('event', 'composition.executed')->count());
    }
}
