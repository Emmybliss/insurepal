<?php

namespace Database\Factories;

use App\Models\Placement;
use Illuminate\Database\Eloquent\Factories\Factory;

class PlacementMarketFactory extends Factory
{
    public function definition(): array
    {
        return [
            'placement_id' => Placement::factory(),
            'is_lead' => true,
            'co_broker_commission' => fake()->randomFloat(2, 1000, 50000),
            'reporting_broker_commission' => fake()->randomFloat(2, 1000, 50000),
        ];
    }
}
