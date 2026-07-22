<?php

namespace Database\Factories;

use App\Models\Policy;
use App\Models\PolicyRisk;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class PolicyRiskFactory extends Factory
{
    protected $model = PolicyRisk::class;

    public function definition(): array
    {
        return [
            'policy_id' => Policy::factory(),
            'tenant_id' => Tenant::factory(),
            'description' => fake()->sentence(),
            'coverage_amount' => fake()->randomFloat(2, 10000, 10000000),
            'rate' => fake()->randomFloat(4, 0.1, 10),
            'rate_basis' => 'percentage',
            'premium' => fake()->randomFloat(2, 1000, 500000),
            'dynamic_fields' => null,
            'sort_order' => 0,
        ];
    }
}
