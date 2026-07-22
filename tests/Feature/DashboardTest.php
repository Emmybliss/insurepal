<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $tenant = \App\Models\Tenant::factory()->create(['onboarding_completed' => true]);
    $user = User::factory()->create(['tenant_id' => $tenant->id]);

    $this->actingAs($user);

    $this->get(route('dashboard'))->assertOk();
});

test('broker dashboard shows commission chart data', function () {
    $tenant = \App\Models\Tenant::factory()->create([
        'type' => 'broker',
        'onboarding_completed' => true,
    ]);

    $user = User::factory()->create([
        'tenant_id' => $tenant->id,
    ]);

    $policy = \App\Models\Policy::factory()->create([
        'tenant_id' => $tenant->id,
        'commission_amount' => 25000.00,
        'status' => 'active',
    ]);

    \App\Models\CommissionEntry::factory()->create([
        'tenant_id' => $tenant->id,
        'policy_id' => $policy->id,
        'amount' => 25000.00,
        'transaction_type' => 'policy',
        'posting_date' => now()->subMonth()->toDateString(),
        'created_by' => $user->id,
    ]);

    \App\Models\CommissionEntry::factory()->create([
        'tenant_id' => $tenant->id,
        'policy_id' => $policy->id,
        'amount' => 5000.00,
        'transaction_type' => 'renewal',
        'posting_date' => now()->toDateString(),
        'created_by' => $user->id,
    ]);

    $this->actingAs($user);

    $response = $this->get(route('dashboard'));

    $response->assertOk();

    $response->assertInertia(fn ($page) => $page
        ->component('dashboard/broker')
        ->has('commission_chart.data')
        ->has('commission_chart_filters')
        ->where('stats.commission_earned', fn ($v) => $v > 0)
    );
});
