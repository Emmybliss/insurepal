<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\PolicyProduct;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PlacementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'placement_number' => 'PL-'.fake()->unique()->numerify('########'),
            'customer_id' => Customer::factory(),
            'policy_product_id' => PolicyProduct::factory(),
            'proposed_start_date' => fake()->date(),
            'proposed_end_date' => fake()->date(),
            'created_by' => User::factory(),
            'status' => 'active',
        ];
    }
}
