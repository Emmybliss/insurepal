<?php

namespace Database\Factories;

use App\Models\Conversation;
use Illuminate\Database\Eloquent\Factories\Factory;

class AiMessageFactory extends Factory
{
    public function definition(): array
    {
        return [
            'conversation_id' => Conversation::factory(),
            'role' => fake()->randomElement(['user', 'assistant']),
            'content' => fake()->paragraphs(3, true),
            'metadata' => [],
            'tool_calls' => null,
            'tool_execution_id' => null,
        ];
    }

    public function user(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'user',
            'content' => fake()->sentence(),
        ]);
    }

    public function assistant(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'assistant',
            'content' => fake()->paragraphs(2, true),
        ]);
    }

    public function system(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'system',
            'content' => fake()->sentence(),
        ]);
    }
}
