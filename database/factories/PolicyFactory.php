<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Policy>
 */
class PolicyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'customer_id' => Customer::factory(),
            'policy_product_id' => \App\Models\PolicyProduct::factory(),
            'created_by' => \App\Models\User::factory(),
            'policy_number' => 'POLI-'.fake()->unique()->numberBetween(100000, 999999),
            'status' => 'active',
            'approval_status' => 'approved',
            'effective_date' => fake()->dateTimeBetween('-1 year', 'now'),
            'expiry_date' => fake()->dateTimeBetween('now', '+1 year'),
            'coverage_details' => json_encode(['coverage' => 'comprehensive']),
            'premium_amount' => fake()->randomFloat(2, 100, 5000),
            'commission_amount' => fake()->randomFloat(2, 10, 500),
            'sum_insured' => fake()->randomFloat(2, 100000, 10000000),
            'total_amount' => fn (array $attributes) => $attributes['premium_amount'],
            'net_premium' => fn (array $attributes) => round($attributes['premium_amount'] - $attributes['commission_amount'], 2),
        ];
    }
}
