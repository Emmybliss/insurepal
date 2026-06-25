<?php

namespace Database\Factories;

use App\Enums\ReconciliationStatus;
use App\Models\ClientBankAccount;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class BankReconciliationFactory extends Factory
{
    public function definition(): array
    {
        $closingBalance = fake()->randomFloat(2, 100000, 10000000);
        $calculatedBalance = fake()->randomFloat(2, 100000, 10000000);

        return [
            'tenant_id' => Tenant::factory(),
            'client_bank_account_id' => ClientBankAccount::factory(),
            'reconciliation_date' => fake()->dateTimeBetween('-3 months', 'now'),
            'closing_balance' => $closingBalance,
            'calculated_balance' => $calculatedBalance,
            'difference' => round($closingBalance - $calculatedBalance, 2),
            'status' => ReconciliationStatus::Reconciled,
            'reconciled_at' => now(),
            'reconciled_by' => User::factory(),
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ReconciliationStatus::Draft,
            'reconciled_at' => null,
            'reconciled_by' => null,
        ]);
    }

    public function withDifference(): static
    {
        $closingBalance = fake()->randomFloat(2, 100000, 10000000);

        return $this->state(fn (array $attributes) => [
            'closing_balance' => $closingBalance,
            'calculated_balance' => $closingBalance + fake()->randomFloat(2, 100, 5000),
            'difference' => fake()->randomFloat(2, 100, 5000),
            'status' => ReconciliationStatus::DifferenceIdentified,
        ]);
    }

    public function matched(): static
    {
        $balance = fake()->randomFloat(2, 100000, 10000000);

        return $this->state(fn (array $attributes) => [
            'closing_balance' => $balance,
            'calculated_balance' => $balance,
            'difference' => 0,
            'status' => ReconciliationStatus::Reconciled,
        ]);
    }
}
