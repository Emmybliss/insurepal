<?php

namespace Database\Factories;

use App\Models\KnowledgeBaseCategory;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\KnowledgeBaseArticle>
 */
class KnowledgeBaseArticleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'title' => $this->faker->sentence(),
            'slug' => $this->faker->unique()->slug(),
            'content' => $this->faker->paragraphs(5, true),
            'category_id' => KnowledgeBaseCategory::factory(),
            'author_id' => User::factory(),
            'status' => $this->faker->randomElement(['draft', 'published', 'archived']),
            'view_count' => $this->faker->numberBetween(0, 1000),
            'helpful_count' => $this->faker->numberBetween(0, 100),
            'not_helpful_count' => $this->faker->numberBetween(0, 20),
            'is_public' => $this->faker->boolean(80),
            'meta_description' => $this->faker->sentence(),
            'published_at' => $this->faker->optional(0.7)->dateTime(),
        ];
    }
}
