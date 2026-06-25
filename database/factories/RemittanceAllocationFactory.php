<?php

namespace Database\Factories;

use App\Enums\AllocationType;
use App\Models\Remittance;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class RemittanceAllocationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'remittance_id' => Remittance::factory(),
            'allocatable_type' => 'App\\Models\\ReceiptAllocation',
            'allocatable_id' => fake()->numberBetween(1, 1000),
            'allocation_type' => fake()->randomElement(AllocationType::cases()),
            'amount' => fake()->randomFloat(2, 1000, 500000),
            'currency' => 'NGN',
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function premium(): static
    {
        return $this->state(fn (array $attributes) => [
            'allocation_type' => AllocationType::Premium,
        ]);
    }

    public function commission(): static
    {
        return $this->state(fn (array $attributes) => [
            'allocation_type' => AllocationType::Commission,
        ]);
    }

    public function vat(): static
    {
        return $this->state(fn (array $attributes) => [
            'allocation_type' => AllocationType::Vat,
        ]);
    }

    public function claim(): static
    {
        return $this->state(fn (array $attributes) => [
            'allocation_type' => AllocationType::Claim,
        ]);
    }
}
