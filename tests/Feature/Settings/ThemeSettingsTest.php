<?php

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create([
        'status' => 'active',
        'onboarding_completed' => true,
        'theme_settings' => null,
    ]);
    $this->user = User::factory()->create([
        'tenant_id' => $this->tenant->id,
        'is_active' => true,
    ]);
});

// ─── View Theme Settings Page ───

test('can view theme settings page', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('settings.theme'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('settings/theme')
        ->has('currentTheme')
        ->has('themePresets')
    );
});

test('shows saved theme on the settings page', function () {
    $theme = [
        'primary_color' => '#ff0000',
        'secondary_color' => '#00ff00',
        'accent_color' => '#0000ff',
        'gradient' => ['from' => '#ff0000', 'via' => '#00ff00', 'to' => '#0000ff'],
        'sidebar_style' => 'gradient',
        'header_style' => 'solid',
        'body_style' => 'gradient',
    ];
    $this->tenant->update(['theme_settings' => $theme]);

    $this->actingAs($this->user);

    $response = $this->get(route('settings.theme'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('settings/theme')
        ->where('currentTheme.primary_color', '#ff0000')
        ->where('currentTheme.secondary_color', '#00ff00')
    );
});

test('shows default theme when no custom theme saved', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('settings.theme'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('settings/theme')
        ->where('currentTheme.primary_color', Tenant::getDefaultTheme()['primary_color'])
    );
});

// ─── API: Show Theme (JSON) ───

test('can get current theme via api', function () {
    $this->actingAs($this->user);

    $response = $this->getJson(route('api.theme.show'));

    $response->assertOk();
    $response->assertJsonStructure([
        'theme' => ['primary_color', 'secondary_color', 'accent_color', 'gradient', 'sidebar_style', 'header_style', 'body_style'],
        'presets',
    ]);
});

test('returns api theme with saved custom colors', function () {
    $theme = [
        'primary_color' => '#111111',
        'secondary_color' => '#222222',
        'accent_color' => '#333333',
        'gradient' => ['from' => '#111111', 'via' => '#222222', 'to' => '#333333'],
        'sidebar_style' => 'solid',
        'header_style' => 'gradient',
        'body_style' => 'none',
    ];
    $this->tenant->update(['theme_settings' => $theme]);

    $this->actingAs($this->user);

    $response = $this->getJson(route('api.theme.show'));

    $response->assertOk();
    $response->assertJsonPath('theme.primary_color', '#111111');
    $response->assertJsonPath('theme.sidebar_style', 'solid');
});

test('api show returns error when user has no tenant', function () {
    $tenantlessUser = User::factory()->create(['is_active' => true]);
    $this->actingAs($tenantlessUser);

    $response = $this->getJson(route('api.theme.show'));

    $response->assertStatus(403);
    $response->assertJson(['message' => 'Access denied: No tenant association.']);
});

// ─── API: Update Theme ───

test('can update theme settings', function () {
    $this->actingAs($this->user);

    $response = $this->patchJson(route('api.theme.update'), [
        'primary_color' => '#ff5722',
        'secondary_color' => '#9c27b0',
        'accent_color' => '#03a9f4',
        'gradient' => ['from' => '#ff5722', 'via' => '#9c27b0', 'to' => '#03a9f4'],
        'sidebar_style' => 'solid',
        'header_style' => 'gradient',
        'body_style' => 'none',
    ]);

    $response->assertOk();
    $response->assertJson(['message' => 'Theme updated successfully']);
    $response->assertJsonPath('theme.primary_color', '#ff5722');

    $this->tenant->refresh();
    expect($this->tenant->theme_settings['primary_color'])->toBe('#ff5722');
});

test('validates theme update requires valid colors', function () {
    $this->actingAs($this->user);

    $response = $this->patchJson(route('api.theme.update'), [
        'primary_color' => 'invalid',
        'secondary_color' => '#9c27b0',
        'accent_color' => '#03a9f4',
        'gradient' => ['from' => '#ff5722', 'via' => '#9c27b0', 'to' => '#03a9f4'],
        'sidebar_style' => 'solid',
        'header_style' => 'gradient',
        'body_style' => 'none',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['primary_color']);
});

test('validates theme update requires valid style values', function () {
    $this->actingAs($this->user);

    $response = $this->patchJson(route('api.theme.update'), [
        'primary_color' => '#ff5722',
        'secondary_color' => '#9c27b0',
        'accent_color' => '#03a9f4',
        'gradient' => ['from' => '#ff5722', 'via' => '#9c27b0', 'to' => '#03a9f4'],
        'sidebar_style' => 'invalid',
        'header_style' => 'gradient',
        'body_style' => 'none',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['sidebar_style']);
});

test('validates theme update requires all fields', function () {
    $this->actingAs($this->user);

    $response = $this->patchJson(route('api.theme.update'), []);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['primary_color', 'secondary_color', 'accent_color', 'gradient.from', 'sidebar_style', 'header_style', 'body_style']);
});

// ─── Apply Preset ───

test('can apply a theme preset', function () {
    $this->actingAs($this->user);

    $response = $this->from(route('settings.theme'))->post(route('api.theme.preset'), [
        'preset' => 'sunset',
    ]);

    $response->assertRedirect(route('settings.theme'));
    $response->assertSessionHas('message', 'Theme preset applied successfully');

    $this->tenant->refresh();
    expect($this->tenant->theme_settings['primary_color'])->toBe(Tenant::getThemePresets()['sunset']['primary_color']);
});

test('validates preset exists', function () {
    $this->actingAs($this->user);

    $response = $this->from(route('settings.theme'))->post(route('api.theme.preset'), [
        'preset' => 'nonexistent',
    ]);

    $response->assertRedirect(route('settings.theme'));
    $response->assertSessionHasErrors(['preset']);
});

test('validates preset is required', function () {
    $this->actingAs($this->user);

    $response = $this->from(route('settings.theme'))->post(route('api.theme.preset'), []);

    $response->assertRedirect(route('settings.theme'));
    $response->assertSessionHasErrors(['preset']);
});

// ─── Reset Theme ───

test('can reset theme to defaults', function () {
    $this->tenant->update(['theme_settings' => [
        'primary_color' => '#ff0000',
        'secondary_color' => '#00ff00',
        'accent_color' => '#0000ff',
        'gradient' => ['from' => '#ff0000', 'via' => '#00ff00', 'to' => '#0000ff'],
        'sidebar_style' => 'gradient',
        'header_style' => 'solid',
        'body_style' => 'gradient',
    ]]);

    $this->actingAs($this->user);

    $response = $this->from(route('settings.theme'))->post(route('api.theme.reset'));

    $response->assertRedirect(route('settings.theme'));
    $response->assertSessionHas('message', 'Theme reset to default');

    $this->tenant->refresh();
    expect($this->tenant->theme_settings)->toBeNull();
});

// ─── Authentication & Authorization ───

test('requires authentication for all theme routes', function () {
    $this->get(route('settings.theme'))->assertRedirect(route('login'));
    $this->get(route('api.theme.show'))->assertRedirect(route('login'));
});

test('requires authentication for theme mutations', function () {
    $this->patchJson(route('api.theme.update'), [])->assertStatus(401);
    $this->post(route('api.theme.preset'), [])->assertRedirect(route('login'));
    $this->post(route('api.theme.reset'))->assertRedirect(route('login'));
});
