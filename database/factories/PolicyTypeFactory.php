<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class PolicyTypeFactory extends Factory
{
    public function definition(): array
    {
        $types = [
            ['name' => 'Life Insurance', 'code' => 'LIFE'],
            ['name' => 'Motor Insurance', 'code' => 'MOTOR'],
            ['name' => 'Property Insurance', 'code' => 'PROPERTY'],
            ['name' => 'Health Insurance', 'code' => 'HEALTH'],
            ['name' => 'Travel Insurance', 'code' => 'TRAVEL'],
        ];

        $type = $this->faker->randomElement($types);

        return [
            'name' => $type['name'],
            'code' => $type['code'].'_'.$this->faker->randomNumber(3),
            'description' => $this->faker->sentence(),
            'is_active' => $this->faker->boolean(80),
            'form_fields' => [
                [
                    'name' => 'full_name',
                    'type' => 'text',
                    'label' => 'Full Name',
                    'required' => true,
                ],
                [
                    'name' => 'date_of_birth',
                    'type' => 'date',
                    'label' => 'Date of Birth',
                    'required' => true,
                ],
            ],
            'base_premium' => $this->faker->numberBetween(10000, 200000),
            'commission_rate' => $this->faker->numberBetween(5, 25),
            'sort_order' => $this->faker->numberBetween(0, 10),
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
