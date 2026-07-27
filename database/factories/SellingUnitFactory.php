<?php

namespace Database\Factories;

use App\Models\SellingUnit;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class SellingUnitFactory extends Factory
{
    protected $model = SellingUnit::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'name' => fake()->randomElement(['Single', 'Strip', 'Box', 'Carton']),
            'unit_id' => 'piece',
            'quantity' => fake()->randomElement([1, 10, 50, 100]),
            'sale_price' => fake()->randomFloat(0, 50, 5000),
            'is_default' => true,
        ];
    }
}
