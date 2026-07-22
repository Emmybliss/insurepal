<?php

namespace Database\Factories;

use App\Models\EmailAccount;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmailSignatureFactory extends Factory
{
    public function definition(): array
    {
        return [
            'account_id' => EmailAccount::factory(),
            'name' => fake()->word(),
            'body_html' => '<p>'.fake()->name().'<br>'.fake()->jobTitle().'</p>',
            'is_default' => false,
        ];
    }

    public function default(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_default' => true,
        ]);
    }
}
