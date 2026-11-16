<?php

namespace Tests\Feature\Security;

use App\Models\Contact;
use App\Models\Product;
use App\Models\SellingUnit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role = 'salesman', bool $active = true): User
    {
        return User::create([
            'name' => ucfirst($role),
            'username' => $role.'-'.uniqid(),
            'email' => $role.'-'.uniqid().'@example.com',
            'password' => 'password',
            'role' => $role,
            'active' => $active,
        ]);
    }

    private function productPayload(): array
    {
        return [
            'name' => 'Authorized Product',
            'sku' => 'AUTH-'.uniqid(),
            'base_unit_id' => 'piece',
        ];
    }

    private function product(): Product
    {
        $product = Product::create([
            'name' => 'Sellable',
            'sku' => 'SELL-'.uniqid(),
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

    private function salePayload(Product $product, Contact $customer): array
    {
        return [
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
        ];
    }

    public function test_admin_can_create_a_product(): void
    {
        $this->actingAs($this->user('admin'))
            ->post('/inventory', $this->productPayload())
            ->assertRedirect();

        $this->assertDatabaseHas('products', ['name' => 'Authorized Product']);
    }

    public function test_salesman_cannot_create_a_product(): void
    {
        $this->actingAs($this->user('salesman'))
            ->post('/inventory', $this->productPayload())
            ->assertForbidden();
    }

    public function test_salesman_cannot_update_a_product(): void
    {
        $product = $this->product();

        $this->actingAs($this->user('salesman'))
            ->put("/inventory/product/{$product->id}", [
                'name' => 'Changed',
                'sku' => $product->sku,
                'base_unit_id' => 'piece',
            ])
            ->assertForbidden();
    }

    public function test_salesman_cannot_adjust_stock(): void
    {
        $this->actingAs($this->user('salesman'))
            ->post('/inventory/adjust', [])
            ->assertForbidden();
    }

    public function test_salesman_can_create_a_sale(): void
    {
        $product = $this->product();
        $customer = Contact::create([
            'type' => 'person',
            'roles' => ['customer'],
            'name' => 'Customer',
            'phone' => '0300-111',
        ]);

        $this->actingAs($this->user('salesman'))
            ->post('/sales', $this->salePayload($product, $customer))
            ->assertRedirect();

        $this->assertDatabaseHas('sales', ['customer_id' => $customer->id]);
    }

    public function test_inactive_salesman_cannot_create_a_sale(): void
    {
        $product = $this->product();
        $customer = Contact::create([
            'type' => 'person',
            'roles' => ['customer'],
            'name' => 'Customer',
            'phone' => '0300-222',
        ]);

        $this->actingAs($this->user('salesman', active: false))
            ->post('/sales', $this->salePayload($product, $customer))
            ->assertForbidden();
    }

    public function test_salesman_cannot_create_a_purchase(): void
    {
        $supplier = Contact::create([
            'type' => 'organization',
            'roles' => ['supplier'],
            'name' => 'Supplier',
            'phone' => '0300-333',
        ]);
        $product = $this->product();

        $this->actingAs($this->user('salesman'))
            ->post('/purchases', [
                'invoice_ref' => 'PUR-AUTH-'.uniqid(),
                'supplier_id' => $supplier->id,
                'date' => now()->format('Y-m-d'),
                'items' => [[
                    'product_id' => $product->id,
                    'purchase_pack_qty' => 1,
                    'purchase_quantity' => 1,
                    'unit_cost' => 10,
                ]],
                'amount_paid' => 10,
                'payment_status' => 'paid',
                'status' => 'received',
            ])
            ->assertForbidden();
    }

    public function test_admin_can_create_a_purchase(): void
    {
        $supplier = Contact::create([
            'type' => 'organization',
            'roles' => ['supplier'],
            'name' => 'Supplier',
            'phone' => '0300-444',
        ]);
        $product = $this->product();

        $this->actingAs($this->user('admin'))
            ->post('/purchases', [
                'invoice_ref' => 'PUR-ADMIN-'.uniqid(),
                'supplier_id' => $supplier->id,
                'date' => now()->format('Y-m-d'),
                'items' => [[
                    'product_id' => $product->id,
                    'purchase_pack_qty' => 1,
                    'purchase_quantity' => 1,
                    'unit_cost' => 10,
                ]],
                'amount_paid' => 10,
                'payment_status' => 'paid',
                'status' => 'received',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('purchase_bills', ['supplier_id' => $supplier->id]);
    }

    public function test_salesman_cannot_create_a_return(): void
    {
        $this->actingAs($this->user('salesman'))
            ->post('/returns/sale', [])
            ->assertForbidden();
    }

    public function test_salesman_cannot_update_settings(): void
    {
        $this->actingAs($this->user('salesman'))
            ->put('/settings', ['business' => ['business_name' => 'Nope']])
            ->assertForbidden();
    }

    public function test_admin_can_update_settings(): void
    {
        $this->actingAs($this->user('admin'))
            ->put('/settings', ['business' => ['business_name' => 'Allowed']])
            ->assertRedirect();
    }
}
