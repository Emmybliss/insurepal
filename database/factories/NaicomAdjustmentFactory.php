<?php

namespace Database\Factories;

use App\Enums\AdjustmentStatus;
use App\Enums\FormType;
use App\Models\NaicomReportRun;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class NaicomAdjustmentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'report_run_id' => NaicomReportRun::factory(),
            'report_line_id' => null,
            'form_type' => fake()->randomElement(FormType::cases()),
            'field' => fake()->randomElement(['premium_amount', 'commission_amount', 'vat_amount']),
            'calculated_value' => fake()->randomFloat(2, 1000, 50000),
            'adjusted_value' => fake()->randomFloat(2, 1000, 50000),
            'reason' => fake()->sentence(),
            'supporting_document' => null,
            'created_by' => User::factory(),
            'reviewed_by' => null,
            'approved_by' => null,
            'status' => AdjustmentStatus::Draft,
        ];
    }
}
