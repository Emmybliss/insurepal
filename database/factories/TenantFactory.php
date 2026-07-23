<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tenant>
 */
class TenantFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = 'Tenant '.fake()->unique()->randomNumber(4);

        return [
            'name' => $name,
            'slug' => \Illuminate\Support\Str::slug($name),
            'type' => fake()->randomElement(['broker', 'underwriter']),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'address' => fake()->address(),
            'logo' => null,
            'settings' => [],
            'theme_settings' => [],
            'status' => 'active',
            'trial_ends_at' => fake()->dateTimeBetween('now', '+30 days'),
            'default_locale' => 'en',
            'parent_tenant_id' => null,
            'company_name' => $name,
            'contact_email' => fake()->safeEmail(),
            'contact_phone' => fake()->phoneNumber(),
            'city' => fake()->city(),
            'state' => fake()->state(),
            'postal_code' => fake()->postcode(),
            'country' => fake()->country(),
            'naicom_reg_number' => fake()->numerify('NAICOM-####'),
            'rc_number' => fake()->numerify('RC-####'),
            'website' => fake()->url(),
            'onboarding_completed' => true,
            'onboarding_steps' => [],
            'onboarding_completed_at' => now(),
            'subscription_plan_id' => null,
            'paystack_customer_code' => null,
            'paystack_subscription_code' => null,
            'subscription_started_at' => null,
            'subscription_expires_at' => null,
        ];
    }
}
