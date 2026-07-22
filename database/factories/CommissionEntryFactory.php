<?php

namespace Database\Factories;

use App\Enums\CommissionTransactionType;
use App\Models\Policy;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CommissionEntryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'policy_id' => Policy::factory(),
            'transaction_type' => CommissionTransactionType::Policy->value,
            'amount' => fake()->randomFloat(2, 100, 5000),
            'posting_date' => fake()->date(),
            'created_by' => User::factory(),
        ];
    }
}
