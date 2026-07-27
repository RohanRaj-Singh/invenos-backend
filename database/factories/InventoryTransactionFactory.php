<?php

namespace Database\Factories;

use App\Models\InventoryTransaction;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class InventoryTransactionFactory extends Factory
{
    protected $model = InventoryTransaction::class;
    public function definition(): array
    {
        $qty = fake()->randomNumber(3);
        return [
            'product_id' => Product::factory(),
            'type' => fake()->randomElement(['purchase', 'sale', 'adjustment']),
            'quantity' => $qty,
            'unit' => 'piece',
            'date' => fake()->date(),
            'reference' => strtoupper(fake()->bothify('REF-####')),
            'running_balance' => $qty,
        ];
    }
}
