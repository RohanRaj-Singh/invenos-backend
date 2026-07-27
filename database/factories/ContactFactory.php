<?php

namespace Database\Factories;

use App\Models\Contact;
use Illuminate\Database\Eloquent\Factories\Factory;

class ContactFactory extends Factory
{
    protected $model = Contact::class;

    public function definition(): array
    {
        $isPerson = $this->faker->boolean(70);
        return [
            'type' => $isPerson ? 'person' : 'organization',
            'roles' => ['customer'],
            'name' => $isPerson ? $this->faker->name() : $this->faker->company(),
            'company_name' => $isPerson ? null : $this->faker->company(),
            'contact_person' => $isPerson ? null : $this->faker->name(),
            'phone' => $this->faker->phoneNumber(),
            'email' => $this->faker->email(),
            'address' => $this->faker->address(),
            'opening_balance' => $this->faker->randomFloat(0, 0, 50000),
            'balance_type' => $this->faker->randomElement(['receivable', 'payable']),
            'current_balance' => 0,
        ];
    }

    public function customer(): static { return $this->state(fn() => ['roles' => ['customer']]); }
    public function supplier(): static { return $this->state(fn() => ['roles' => ['supplier']]); }
    public function patient(): static { return $this->state(fn() => ['roles' => ['patient']]); }
    public function customerAndSupplier(): static { return $this->state(fn() => ['roles' => ['customer', 'supplier']]); }
}
