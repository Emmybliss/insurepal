<?php

namespace Database\Factories;

use App\Enums\ReportHalf;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class NaicomReportRunFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'reporting_year' => now()->year,
            'reporting_half' => fake()->randomElement(ReportHalf::cases()),
            'status' => 'generated',
            'generated_by' => User::factory(),
            'metadata' => [],
        ];
    }

    public function withStatus(string $status): static
    {
        return $this->state(fn (array $attributes) => ['status' => $status]);
    }
}
