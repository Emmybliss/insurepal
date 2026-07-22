<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ToolExecutionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tenant_id' => \App\Models\Tenant::factory(),
            'user_id' => User::factory(),
            'conversation_id' => Conversation::factory(),
            'tool_name' => fake()->randomElement(['search_customer', 'search_policy', 'generate_quote']),
            'parameters' => ['query' => fake()->word()],
            'status' => 'completed',
            'result' => ['found' => true, 'data' => []],
            'error_message' => null,
            'approved_at' => null,
            'approved_by' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'result' => null,
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => User::factory(),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
            'result' => null,
            'error_message' => fake()->sentence(),
        ]);
    }
}
