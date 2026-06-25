<?php

namespace Database\Factories;

use App\Models\BankReconciliation;
use Illuminate\Database\Eloquent\Factories\Factory;

class BankReconciliationLineFactory extends Factory
{
    public function definition(): array
    {
        return [
            'reconciliation_id' => BankReconciliation::factory(),
            'source_type' => fake()->randomElement([
                'App\\Models\\Receipt',
                'App\\Models\\Remittance',
            ]),
            'source_id' => fake()->numberBetween(1, 1000),
            'type' => fake()->randomElement(['receipt', 'remittance', 'bank_charge', 'interest', 'adjustment']),
            'amount' => fake()->randomFloat(2, 1000, 500000),
            'matched' => fake()->boolean(80),
        ];
    }

    public function matched(): static
    {
        return $this->state(fn (array $attributes) => [
            'matched' => true,
        ]);
    }

    public function unmatched(): static
    {
        return $this->state(fn (array $attributes) => [
            'matched' => false,
        ]);
    }

    public function receipt(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'receipt',
        ]);
    }

    public function remittance(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'remittance',
        ]);
    }
}
