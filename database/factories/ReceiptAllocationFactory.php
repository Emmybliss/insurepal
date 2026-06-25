<?php

namespace Database\Factories;

use App\Enums\AllocationType;
use App\Models\Policy;
use App\Models\Receipt;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReceiptAllocationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'receipt_id' => Receipt::factory(),
            'policy_id' => Policy::factory(),
            'allocation_type' => fake()->randomElement(AllocationType::cases()),
            'amount' => fake()->randomFloat(2, 100, 50000),
            'currency' => 'NGN',
            'exchange_rate' => 1.0,
            'is_direct_to_insurer' => fake()->boolean(20),
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function directToInsurer(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_direct_to_insurer' => true,
        ]);
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
}
