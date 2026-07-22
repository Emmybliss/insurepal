<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class EmailTemplateFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tenant_id' => \App\Models\Tenant::factory(),
            'name' => fake()->word().' Template',
            'subject' => fake()->sentence(),
            'body_html' => '<p>'.fake()->paragraphs(3, true).'</p>',
            'category' => fake()->randomElement(['general', 'claims', 'quotes', 'notifications']),
        ];
    }
}
