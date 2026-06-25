<?php

namespace Database\Factories;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'invoice_number' => 'INV-'.fake()->unique()->numerify('########'),
            'total_amount' => fake()->randomFloat(2, 1000, 500000),
            'subtotal' => fake()->randomFloat(2, 1000, 500000),
            'status' => 'paid',
            'due_date' => fake()->date(),
        ];
    }
}
