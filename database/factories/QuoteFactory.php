<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\InsuranceProduct;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuoteFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'customer_id' => Customer::factory(),
            'insurance_product_id' => InsuranceProduct::factory(),
            'quote_number' => 'QT'.now()->format('Y').fake()->unique()->numberBetween(100000, 999999),
            'status' => 'draft',
            'coverage_details' => json_encode(['coverage' => 'comprehensive']),
            'premium_amount' => fake()->randomFloat(2, 100, 5000),
            'commission_amount' => fake()->randomFloat(2, 10, 500),
            'total_amount' => fn (array $attributes) => $attributes['premium_amount'],
            'valid_until' => now()->addDays(30),
            'created_by' => User::factory(),
        ];
    }
}
