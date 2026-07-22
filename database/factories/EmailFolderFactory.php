<?php

namespace Database\Factories;

use App\Models\EmailAccount;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmailFolderFactory extends Factory
{
    public function definition(): array
    {
        return [
            'account_id' => EmailAccount::factory(),
            'name' => fake()->word(),
            'remote_id' => (string) fake()->unique()->numerify('###'),
            'type' => fake()->randomElement(['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive']),
            'parent_id' => null,
        ];
    }

    public function inbox(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Inbox',
            'type' => 'inbox',
        ]);
    }

    public function sent(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Sent',
            'type' => 'sent',
        ]);
    }
}
