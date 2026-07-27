<?php

namespace Database\Factories;

use App\Models\FinancialTransaction;
use App\Models\Contact;
use Illuminate\Database\Eloquent\Factories\Factory;

class FinancialTransactionFactory extends Factory
{
    protected $model = FinancialTransaction::class;
    public function definition(): array
    {
        return [
            'contact_id' => Contact::factory(),
            'direction' => fake()->randomElement(['in', 'out']),
            'type' => fake()->randomElement(['collection', 'payout']),
            'date' => fake()->date(),
            'amount' => fake()->randomFloat(0, 100, 50000),
            'method' => fake()->randomElement(['cash', 'card', 'transfer']),
            'reference' => strtoupper(fake()->bothify('REF-####')),
            'created_by' => 'Seeder',
        ];
    }
}
