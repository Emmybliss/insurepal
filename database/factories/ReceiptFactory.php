<?php

namespace Database\Factories;

use App\Models\ClientBankAccount;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Policy;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReceiptFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'customer_id' => Customer::factory(),
            'policy_id' => Policy::factory(),
            'invoice_id' => Invoice::factory(),
            'receipt_number' => 'RCP-'.now()->year.'-'.fake()->unique()->numerify('########'),
            'payment_date' => fake()->dateTimeBetween('-6 months', 'now'),
            'payment_method' => fake()->randomElement(['cash', 'bank_transfer', 'cheque', 'credit_card', 'debit_card']),
            'amount_paid' => fake()->randomFloat(2, 1000, 500000),
            'currency' => 'NGN',
            'payment_status' => fake()->randomElement(['pending', 'completed', 'failed']),
            'client_bank_account_id' => ClientBankAccount::factory(),
            'cleared_at' => null,
            'is_cleared' => false,
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_status' => 'completed',
        ]);
    }

    public function cash(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_method' => 'cash',
        ]);
    }

    public function cheque(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_method' => 'cheque',
        ]);
    }

    public function cleared(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_cleared' => true,
            'cleared_at' => now(),
        ]);
    }
}
