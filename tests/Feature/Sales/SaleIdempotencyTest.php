<?php

namespace Tests\Feature\Sales;

use App\Models\Contact;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SellingUnit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleIdempotencyTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::create([
            'name' => 'Admin',
            'username' => 'admin-'.uniqid(),
            'email' => 'admin-'.uniqid().'@example.com',
            'password' => 'password',
            'role' => 'admin',
        ]);
    }

    private function product(): Product
    {
        $product = Product::create([
            'name' => 'Idempotent Product',
            'sku' => 'IDEM-'.uniqid(),
            'base_unit_id' => 'piece',
            'stock_quantity' => 10,
            'status' => 'in-stock',
        ]);

        SellingUnit::create([
            'product_id' => $product->id,
            'name' => 'Single',
            'unit_id' => 'piece',
            'quantity' => 1,
            'sale_price' => 100,
            'is_default' => true,
        ]);

        return $product;
    }

    private function payload(Product $product, Contact $customer, ?string $key): array
    {
        return array_filter([
            'idempotency_key' => $key,
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 1,
                'packaging_quantity' => 1,
                'packaging_name' => 'Single',
                'selling_unit_id' => $product->sellingUnits()->first()->id,
                'base_unit_quantity' => 1,
                'unit_price' => 100,
                'total' => 100,
            ]],
            'customer_id' => $customer->id,
            'discount' => 0,
            'amount_paid' => 100,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'source' => 'pos',
            'date' => now()->format('Y-m-d'),
        ], fn ($value) => $value !== null);
    }

    private function customer(): Contact
    {
        return Contact::create([
            'type' => 'person',
            'roles' => ['customer'],
            'name' => 'Customer',
            'phone' => '0300-111',
        ]);
    }

    public function test_the_same_key_returns_the_original_sale_and_does_not_deduct_again(): void
    {
        $product = $this->product();
        $customer = $this->customer();
        $key = 'sale-'.uniqid();

        $first = $this->actingAs($this->admin())
            ->post('/sales', $this->payload($product, $customer, $key));
        $first->assertRedirect();

        $sale = Sale::firstOrFail();

        $second = $this->actingAs($this->admin())
            ->post('/sales', $this->payload($product, $customer, $key));

        $second->assertRedirect(route('sales.show', $sale->id));

        $this->assertSame(1, Sale::count());
        $this->assertSame(9.0, (float) $product->fresh()->stock_quantity);
        $this->assertSame(1, InventoryTransaction::where('product_id', $product->id)->where('type', 'sale')->count());
    }

    public function test_different_keys_create_different_sales(): void
    {
        $product = $this->product();
        $customer = $this->customer();

        $this->actingAs($this->admin())
            ->post('/sales', $this->payload($product, $customer, 'sale-a-'.uniqid()))
            ->assertRedirect();

        $this->actingAs($this->admin())
            ->post('/sales', $this->payload($product, $customer, 'sale-b-'.uniqid()))
            ->assertRedirect();

        $this->assertSame(2, Sale::count());
        $this->assertSame(8.0, (float) $product->fresh()->stock_quantity);
    }

    public function test_sales_without_a_key_remain_independent(): void
    {
        $product = $this->product();
        $customer = $this->customer();

        $this->actingAs($this->admin())
            ->post('/sales', $this->payload($product, $customer, null))
            ->assertRedirect();

        $this->actingAs($this->admin())
            ->post('/sales', $this->payload($product, $customer, null))
            ->assertRedirect();

        $this->assertSame(2, Sale::count());
        $this->assertSame(8.0, (float) $product->fresh()->stock_quantity);
    }
}
