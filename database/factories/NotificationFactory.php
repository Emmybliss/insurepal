<?php

namespace Database\Factories;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class NotificationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'user_id' => User::factory(),
            'type' => fake()->randomElement(['policy_expiry', 'payment_due', 'document_ready', 'renewal_reminder', 'system_alert']),
            'title' => fake()->sentence(),
            'message' => fake()->paragraph(),
            'data' => [],
            'priority' => fake()->randomElement(['low', 'medium', 'high']),
            'read_at' => null,
        ];
    }
}
