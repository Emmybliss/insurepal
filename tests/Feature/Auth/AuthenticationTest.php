<?php

use App\Models\User;

test('login screen can be rendered', function () {
    $response = $this->get(route('login'));

    $response->assertStatus(200);
});

test('users can authenticate using the login screen', function () {
    $tenant = \App\Models\Tenant::factory()->create();
    $user = User::factory()->create(['tenant_id' => $tenant->id]);

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
        'cf-turnstile-response' => 'test',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect();
});

test('users can not authenticate with invalid password', function () {
    $tenant = \App\Models\Tenant::factory()->create();
    $user = User::factory()->create(['tenant_id' => $tenant->id]);

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
        'cf-turnstile-response' => 'test',
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $tenant = \App\Models\Tenant::factory()->create(['onboarding_completed' => true]);
    $user = User::factory()->create(['tenant_id' => $tenant->id]);

    $response = $this->actingAs($user)->post(route('logout'));

    $this->assertGuest();
<<<<<<< HEAD
    $response->assertRedirect('/');
=======
    $response->assertRedirect(route('login'));
>>>>>>> 4b443a0 (Added The Naicom report and Various broker slip)
});

test('users get validation errors with invalid credentials', function () {
    $tenant = \App\Models\Tenant::factory()->create();
    $user = User::factory()->create(['tenant_id' => $tenant->id]);

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ])->assertSessionHasErrors();
});
