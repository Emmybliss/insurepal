<?php

namespace Database\Factories;

use App\Models\PolicyClass;
use App\Models\PolicyType;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class PolicyProductFactory extends Factory
{
    public function definition(): array
    {
        $policyType = PolicyType::factory()->create();
        $policyClass = PolicyClass::factory()->create(['policy_type_id' => $policyType->id]);

        return [
            'tenant_id' => Tenant::factory(),
            'policy_type_id' => $policyType->id,
            'policy_class_id' => $policyClass->id,
            'name' => fake()->word().' Insurance',
            'code' => strtoupper(fake()->lexify('???')),
            'base_premium' => 10000,
            'commission_rate' => 10,
            'is_active' => true,
        ];
    }
}
