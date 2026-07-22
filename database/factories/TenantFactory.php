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
        $name = 'Tenant '.$this->faker->unique()->randomNumber(4);

        return [
            'name' => $name,
            'slug' => \Illuminate\Support\Str::slug($name),
            'type' => $this->faker->randomElement(['broker', 'underwriter']),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'address' => $this->faker->address(),
            'logo' => null,
            'settings' => [],
            'theme_settings' => [],
            'status' => 'active',
            'trial_ends_at' => $this->faker->dateTimeBetween('now', '+30 days'),
            'default_locale' => 'en',
            'parent_tenant_id' => null,
            'company_name' => $name,
            'contact_email' => $this->faker->safeEmail(),
            'contact_phone' => $this->faker->phoneNumber(),
            'city' => $this->faker->city(),
            'state' => $this->faker->state(),
            'postal_code' => $this->faker->postcode(),
            'country' => $this->faker->country(),
            'naicom_reg_number' => $this->faker->numerify('NAICOM-####'),
            'rc_number' => $this->faker->numerify('RC-####'),
            'website' => $this->faker->url(),
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
