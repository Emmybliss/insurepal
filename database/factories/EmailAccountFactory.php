<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class EmailAccountFactory extends Factory
{
    public function definition(): array
    {
        $provider = fake()->randomElement(['gmail', 'outlook', 'imap']);

        return [
            'tenant_id' => \App\Models\Tenant::factory(),
            'provider' => $provider,
            'email' => fake()->unique()->safeEmail(),
            'account_name' => fake()->word().' Mail',
            'credentials_encrypted' => encrypt(json_encode(['password' => fake()->password()])),
            'oauth_token_encrypted' => encrypt(fake()->sha256()),
            'refresh_token_encrypted' => encrypt(fake()->sha256()),
            'token_expires_at' => fake()->dateTimeBetween('now', '+30 days'),
            'imap_host' => $provider === 'imap' ? fake()->domainName() : null,
            'imap_port' => $provider === 'imap' ? 993 : null,
            'smtp_host' => $provider === 'imap' ? fake()->domainName() : null,
            'smtp_port' => $provider === 'imap' ? 587 : null,
            'is_active' => true,
            'last_sync_at' => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function expiredToken(): static
    {
        return $this->state(fn (array $attributes) => [
            'token_expires_at' => now()->subDay(),
        ]);
    }
}
