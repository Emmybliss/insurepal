<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class PolicyClassFactory extends Factory
{
    public function definition(): array
    {
        return [
            'policy_type_id' => \App\Models\PolicyType::factory(),
            'name' => fake()->word().' Class',
            'code' => strtoupper(fake()->lexify('???')),
            'is_active' => true,
        ];
    }
}
