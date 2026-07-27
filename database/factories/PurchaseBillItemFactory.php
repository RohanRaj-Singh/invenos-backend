<?php

namespace Database\Factories;

use App\Models\PurchaseBillItem;
use App\Models\Product;
use App\Models\PurchaseBill;
use Illuminate\Database\Eloquent\Factories\Factory;

class PurchaseBillItemFactory extends Factory
{
    protected $model = PurchaseBillItem::class;
    public function definition(): array
    {
        $packQty = fake()->randomFloat(0, 10, 100);
        $unitCost = fake()->randomFloat(0, 50, 5000);
        return [
            'purchase_bill_id' => PurchaseBill::factory(),
            'product_id' => Product::factory(),
            'product_name' => fake()->word(),
            'purchase_pack_qty' => $packQty,
            'purchase_quantity' => fake()->numberBetween(1, 20),
            'unit_cost' => $unitCost,
            'total_cost' => $packQty * $unitCost,
        ];
    }
}
