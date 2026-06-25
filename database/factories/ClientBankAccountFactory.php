<?php

namespace Database\Factories;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class ClientBankAccountFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'bank_name' => fake()->randomElement(['GTBank', 'Access Bank', 'Zenith Bank', 'UBA', 'First Bank', 'Fidelity Bank']),
            'account_name' => fake()->company().' Clients Account',
            'account_number' => fake()->numerify('##########'),
            'account_type' => fake()->randomElement(['savings', 'current']),
            'currency' => 'NGN',
            'is_active' => true,
            'opening_balance' => fake()->randomFloat(2, 0, 5000000),
            'opening_balance_date' => fake()->optional()->date(),
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function foreignCurrency(): static
    {
        return $this->state(fn (array $attributes) => [
            'currency' => fake()->randomElement(['USD', 'GBP', 'EUR']),
        ]);
    }
}
