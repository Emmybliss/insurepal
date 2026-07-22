<?php

namespace Database\Factories;

use App\Models\Policy;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PolicyAmendmentFactory extends Factory
{
    public function definition(): array
    {
        $amendmentTypes = ['coverage_change', 'premium_adjustment', 'beneficiary_change', 'policy_details_update', 'term_extension', 'endorsement', 'correction'];

        return [
            'tenant_id' => Tenant::factory(),
            'policy_id' => Policy::factory(),
            'amendment_type' => fake()->randomElement($amendmentTypes),
            'status' => fake()->randomElement(['draft', 'pending_approval', 'approved', 'active']),
            'original_data' => json_encode(['premium_amount' => fake()->randomFloat(2, 100, 5000)]),
            'amended_data' => json_encode(['premium_amount' => fake()->randomFloat(2, 100, 5000)]),
            'changes_summary' => json_encode([['field' => 'premium_amount', 'from' => '1000', 'to' => '2000']]),
            'premium_adjustment' => fake()->randomFloat(2, 0, 1000),
            'new_premium_amount' => fake()->randomFloat(2, 100, 5000),
            'effective_date' => fake()->date(),
            'amendment_reason' => fake()->sentence(),
            'created_by' => User::factory(),
        ];
    }
}
