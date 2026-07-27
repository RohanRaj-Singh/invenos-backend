<?php

namespace Database\Factories;

use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Database\Eloquent\Factories\Factory;

class SaleItemFactory extends Factory
{
    protected $model = SaleItem::class;
    public function definition(): array
    {
        return [
            'sale_id' => Sale::factory(),
            'product_id' => Product::factory(),
            'product_name' => fake()->word(),
            'packaging_quantity' => fake()->numberBetween(1, 10),
            'base_unit_quantity' => 1,
            'base_quantity' => fake()->numberBetween(1, 10),
            'unit_price' => fake()->randomFloat(0, 50, 1000),
            'total' => fake()->randomFloat(0, 100, 5000),
            'category' => fake()->word(),
        ];
    }
}
