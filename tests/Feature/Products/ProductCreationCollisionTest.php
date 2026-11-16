<?php

namespace Tests\Feature\Products;

use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductCreationCollisionTest extends TestCase
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

    private function packaging(): array
    {
        $box = ProductUnit::where('name', 'Box')->firstOrFail();
        $piece = ProductUnit::where('name', 'Piece')->firstOrFail();

        return [[
            'container_unit_id' => $box->id,
            'contains_unit_id' => $piece->id,
            'quantity' => 10,
            'level' => 1,
        ]];
    }

    public function test_sku_collision_preserves_packaging(): void
    {
        $existing = Product::create([
            'name' => 'Existing SKU Product',
            'sku' => 'COL-SKU-'.uniqid(),
            'barcode' => 'BC-EXISTING-'.uniqid(),
            'base_unit_id' => 'piece',
        ]);

        $this->actingAs($this->admin())
            ->post('/inventory', [
                'name' => 'Colliding SKU Product',
                'sku' => $existing->sku,
                'barcode' => 'BC-NEW-'.uniqid(),
                'base_unit_id' => 'piece',
                'packaging' => $this->packaging(),
            ])
            ->assertRedirect();

        $created = Product::where('name', 'Colliding SKU Product')->firstOrFail();

        $this->assertNotSame($existing->sku, $created->sku);
        $this->assertDatabaseHas('product_packaging', [
            'product_id' => $created->id,
            'quantity' => 10,
        ]);
    }

    public function test_barcode_collision_preserves_packaging(): void
    {
        $existing = Product::create([
            'name' => 'Existing Barcode Product',
            'sku' => 'COL-BC-'.uniqid(),
            'barcode' => 'BC-DUPLICATE-'.uniqid(),
            'base_unit_id' => 'piece',
        ]);

        // Live duplicates are rejected by validation; the controller collision
        // branch handles barcodes held by soft-deleted products.
        $existing->delete();

        $this->actingAs($this->admin())
            ->post('/inventory', [
                'name' => 'Colliding Barcode Product',
                'sku' => 'COL-NEW-'.uniqid(),
                'barcode' => $existing->barcode,
                'base_unit_id' => 'piece',
                'packaging' => $this->packaging(),
            ])
            ->assertRedirect();

        $created = Product::where('name', 'Colliding Barcode Product')->firstOrFail();

        $this->assertSame($existing->barcode.'-1', $created->barcode);
        $this->assertDatabaseHas('product_packaging', [
            'product_id' => $created->id,
            'quantity' => 10,
        ]);
    }
}
