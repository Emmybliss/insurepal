<?php

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

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

// ─── Edit (Show form) ───

test('can view company settings page', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('settings.company'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('settings/company')
        ->has('company')
    );
});

test('shows company data on settings page', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('settings.company'));

    $response->assertInertia(fn ($page) => $page
        ->where('company.name', $this->tenant->name)
        ->where('company.email', $this->tenant->email)
    );
});

// ─── Update (Text fields) ───

test('can update company text settings', function () {
    $this->actingAs($this->user);

    $response = $this->patch(route('settings.company.update'), [
        'name' => 'Updated Broker Ltd',
        'email' => 'updated@broker.com',
        'phone' => '+2348000000000',
        'address' => '123 New Street',
        'city' => 'Lagos',
        'state' => 'Lagos',
        'country' => 'Nigeria',
    ]);

    $response->assertSessionHas('success');

    $this->tenant->refresh();
    expect($this->tenant->name)->toBe('Updated Broker Ltd');
    expect($this->tenant->email)->toBe('updated@broker.com');
    expect($this->tenant->phone)->toBe('+2348000000000');
});

test('validates required company fields', function () {
    $this->actingAs($this->user);

    $response = $this->patch(route('settings.company.update'), [
        'name' => '',
        'email' => 'not-an-email',
        'phone' => '',
        'address' => '',
        'city' => '',
        'state' => '',
        'country' => '',
    ]);

    $response->assertSessionHasErrors(['name', 'email', 'phone', 'address', 'city', 'state', 'country']);
});

test('can upload logo', function () {
    Storage::fake('public');

    $this->actingAs($this->user);

    $file = UploadedFile::fake()->image('logo.png', 200, 200);

    $response = $this->patch(route('settings.company.update'), [
        'name' => 'Test Broker',
        'email' => 'test@broker.com',
        'phone' => '+2348000000000',
        'address' => 'Test Address',
        'city' => 'Lagos',
        'state' => 'Lagos',
        'country' => 'Nigeria',
        'logo' => $file,
    ]);

    $response->assertSessionHas('success');

    $this->tenant->refresh();
    expect($this->tenant->logo)->not->toBeNull();
    Storage::disk('public')->assertExists($this->tenant->logo);
});

test('replaces old logo on re-upload', function () {
    Storage::fake('public');

    $this->actingAs($this->user);

    $oldFile = UploadedFile::fake()->image('old-logo.png');
    $this->patch(route('settings.company.update'), [
        'name' => 'Test',
        'email' => 't@t.com',
        'phone' => '+2348000000000',
        'address' => 'A',
        'city' => 'Lagos',
        'state' => 'Lagos',
        'country' => 'Nigeria',
        'logo' => $oldFile,
    ]);

    $this->tenant->refresh();
    $oldPath = $this->tenant->logo;

    $newFile = UploadedFile::fake()->image('new-logo.png');
    $this->patch(route('settings.company.update'), [
        'name' => 'Test',
        'email' => 't@t.com',
        'phone' => '+2348000000000',
        'address' => 'A',
        'city' => 'Lagos',
        'state' => 'Lagos',
        'country' => 'Nigeria',
        'logo' => $newFile,
    ]);

    $this->tenant->refresh();
    expect($this->tenant->logo)->not->toBe($oldPath);
    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($this->tenant->logo);
});

test('requires authentication for company settings', function () {
    $response = $this->get(route('settings.company'));

    $response->assertStatus(302);
    $response->assertRedirectToRoute('login');
});

test('rejects user without tenant', function () {
    $noTenantUser = User::factory()->create(['tenant_id' => null]);
    $this->actingAs($noTenantUser);

    $response = $this->get(route('settings.company'));

    $response->assertStatus(403);
});
