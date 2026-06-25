<?php

namespace Database\Factories;

use App\Enums\FormType;
use App\Models\NaicomReportRun;
use Illuminate\Database\Eloquent\Factories\Factory;

class NaicomReportLineFactory extends Factory
{
    public function definition(): array
    {
        return [
            'report_run_id' => NaicomReportRun::factory(),
            'form_type' => fake()->randomElement(FormType::cases()),
            'row_number' => fake()->numberBetween(1, 100),
            'month' => fake()->numberBetween(1, 12),
            'data' => [
                'customer_name' => fake()->company(),
                'insurer_name' => fake()->company(),
                'total_gross_premium' => fake()->randomFloat(2, 1000, 50000),
                'commission_earned' => fake()->randomFloat(2, 100, 5000),
            ],
            'calculated_amount' => fake()->randomFloat(2, 1000, 50000),
        ];
    }
}
