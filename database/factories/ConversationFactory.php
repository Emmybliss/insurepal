<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ConversationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tenant_id' => \App\Models\Tenant::factory(),
            'user_id' => User::factory(),
            'title' => fake()->sentence(4),
            'context_type' => fake()->randomElement(['policy', 'claim', 'quote', 'general', null]),
            'context_id' => null,
            'metadata' => [],
        ];
    }

    public function withContext(string $type, int $id): static
    {
        return $this->state(fn (array $attributes) => [
            'context_type' => $type,
            'context_id' => $id,
        ]);
    }
}
