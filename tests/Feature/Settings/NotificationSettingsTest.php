<?php

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create([
        'status' => 'active',
        'onboarding_completed' => true,
    ]);

    $this->user = User::factory()->create([
        'tenant_id' => $this->tenant->id,
        'is_active' => true,
    ]);
});

// ─── Index ───

test('can view notification settings page', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('settings.notifications'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('settings/notifications')
        ->has('notification_preferences')
    );
});

test('shows default notification preferences when none are set', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('settings.notifications'));

    $response->assertInertia(fn ($page) => $page
        ->where('notification_preferences.email_notifications', true)
        ->where('notification_preferences.sms_notifications', false)
        ->where('notification_preferences.push_notifications', true)
        ->where('notification_preferences.marketing_notifications', false)
        ->where('notification_preferences.policy_expiry_notifications', true)
        ->where('notification_preferences.payment_due_notifications', true)
        ->where('notification_preferences.claim_status_notifications', true)
        ->where('notification_preferences.system_maintenance_notifications', true)
    );
});

test('shows saved notification preferences', function () {
    $this->user->update(['settings' => [
        'email_notifications' => false,
        'sms_notifications' => true,
        'push_notifications' => false,
    ]]);

    $this->actingAs($this->user);

    $response = $this->get(route('settings.notifications'));

    $response->assertInertia(fn ($page) => $page
        ->where('notification_preferences.email_notifications', false)
        ->where('notification_preferences.sms_notifications', true)
        ->where('notification_preferences.push_notifications', false)
    );
});

// ─── Update ───

test('can update notification preferences', function () {
    $this->actingAs($this->user);

    $response = $this->patch(route('settings.notifications.update'), [
        'email_notifications' => false,
        'sms_notifications' => true,
        'push_notifications' => false,
        'marketing_notifications' => true,
        'policy_expiry_notifications' => false,
        'payment_due_notifications' => true,
        'claim_status_notifications' => false,
        'system_maintenance_notifications' => true,
    ]);

    $response->assertSessionHas('success');

    $this->user->refresh();
    expect($this->user->settings['email_notifications'])->toBeFalse();
    expect($this->user->settings['sms_notifications'])->toBeTrue();
    expect($this->user->settings['push_notifications'])->toBeFalse();
    expect($this->user->settings['marketing_notifications'])->toBeTrue();
});

test('omitted fields are set to false', function () {
    $this->actingAs($this->user);

    $response = $this->patch(route('settings.notifications.update'), [
        'email_notifications' => true,
    ]);

    $response->assertSessionHas('success');

    $this->user->refresh();
    expect($this->user->settings['email_notifications'])->toBeTrue();
    expect($this->user->settings['sms_notifications'])->toBeFalse();
    expect($this->user->settings['push_notifications'])->toBeFalse();
});

test('requires authentication for notification settings', function () {
    $response = $this->get(route('settings.notifications'));

    $response->assertStatus(302);
    $response->assertRedirectToRoute('login');
});
