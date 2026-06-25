<?php

namespace Database\Factories;

use App\Enums\RemittanceStatus;
use App\Models\ClientBankAccount;
use App\Models\InsuranceCompany;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class RemittanceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'remittance_number' => 'REM-'.fake()->unique()->numerify('########'),
            'client_bank_account_id' => ClientBankAccount::factory(),
            'insurer_id' => InsuranceCompany::factory(),
            'remittance_date' => fake()->dateTimeBetween('-6 months', 'now'),
            'total_amount' => fake()->randomFloat(2, 10000, 5000000),
            'currency' => 'NGN',
            'payment_method' => fake()->randomElement(['bank_transfer', 'cheque', 'cash']),
            'reference' => fake()->optional()->bothify('REF-####-????'),
            'status' => RemittanceStatus::Completed,
            'reversal_reason' => null,
            'reversed_at' => null,
            'reversed_by' => null,
            'notes' => fake()->optional()->sentence(),
            'created_by' => User::factory(),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RemittanceStatus::Draft,
        ]);
    }

    public function reversed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RemittanceStatus::Reversed,
            'reversal_reason' => fake()->sentence(),
            'reversed_at' => now(),
            'reversed_by' => User::factory(),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RemittanceStatus::Failed,
        ]);
    }

    public function foreignCurrency(): static
    {
        return $this->state(fn (array $attributes) => [
            'currency' => fake()->randomElement(['USD', 'GBP', 'EUR']),
        ]);
    }
}
