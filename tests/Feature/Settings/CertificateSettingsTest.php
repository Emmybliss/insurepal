<?php

use App\Models\CertificateSetting;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create([
        'type' => 'underwriter',
        'status' => 'active',
        'onboarding_completed' => true,
    ]);

    $this->user = User::factory()->create([
        'tenant_id' => $this->tenant->id,
        'is_active' => true,
    ]);

    Permission::findOrCreate('manage_certificate_settings', 'web');
    $this->user->givePermissionTo('manage_certificate_settings');
});

// ─── Index ───

test('can view certificate settings page', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('settings.certificates'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('settings/certificates')
        ->has('settings')
        ->has('templates')
        ->has('availableTypes')
    );
});

test('shows saved certificate settings', function () {
    CertificateSetting::setSetting('auto_generate_on_policy_issue', true, CertificateSetting::TYPE_GENERAL, false, $this->tenant->id);
    CertificateSetting::setSetting('include_qr_code', false, CertificateSetting::TYPE_GENERAL, false, $this->tenant->id);

    $this->actingAs($this->user);

    $response = $this->get(route('settings.certificates'));

    $response->assertInertia(fn ($page) => $page
        ->where('settings.auto_generate_on_policy_issue', true)
        ->where('settings.include_qr_code', false)
    );
});

// ─── Update ───

test('can update certificate settings', function () {
    $this->actingAs($this->user);

    $response = $this->patch(route('settings.certificates.update'), [
        'auto_generate_on_policy_issue' => true,
        'include_qr_code' => false,
        'certificate_numbering_format' => 'CERT-{YEAR}-{NUMBER}',
        'certificate_validity_days' => 365,
    ]);

    $response->assertSessionHas('success');

    expect(CertificateSetting::getSetting('auto_generate_on_policy_issue', null, $this->tenant->id))->toBe(true);
    expect(CertificateSetting::getSetting('include_qr_code', null, $this->tenant->id))->toBe(false);
    expect(CertificateSetting::getSetting('certificate_numbering_format', null, $this->tenant->id))->toBe('CERT-{YEAR}-{NUMBER}');
});

test('validates certificate numbering format is required', function () {
    $this->actingAs($this->user);

    $response = $this->patch(route('settings.certificates.update'), [
        'certificate_numbering_format' => '',
    ]);

    $response->assertSessionHasErrors(['certificate_numbering_format']);
});

test('deletes nullable setting when value is null', function () {
    CertificateSetting::setSetting('watermark_text', 'CONFIDENTIAL', CertificateSetting::TYPE_LAYOUT, false, $this->tenant->id);

    $this->actingAs($this->user);

    $this->patch(route('settings.certificates.update'), [
        'watermark_text' => null,
        'certificate_numbering_format' => 'FMT-{NUMBER}',
    ]);

    expect(CertificateSetting::getSetting('watermark_text', 'default', $this->tenant->id))->toBe('default');
});

// ─── Upload Logo ───

test('can upload company logo', function () {
    Storage::fake('public');

    $this->actingAs($this->user);

    $file = UploadedFile::fake()->image('cert-logo.png', 300, 300);

    $response = $this->post(route('settings.certificates.upload-logo'), [
        'logo' => $file,
    ]);
    $response->assertSessionHas('success');

    $savedPath = CertificateSetting::getSetting(CertificateSetting::KEY_COMPANY_LOGO, null, $this->tenant->id);
    expect($savedPath)->not->toBeNull();
    Storage::disk('public')->assertExists($savedPath);
});

test('validates logo is an image', function () {
    $this->actingAs($this->user);

    $response = $this->post(route('settings.certificates.upload-logo'), [
        'logo' => 'not-a-file',
    ]);

    $response->assertSessionHasErrors(['logo']);
});

test('replaces old logo on re-upload', function () {
    Storage::fake('public');

    $this->actingAs($this->user);

    $oldFile = UploadedFile::fake()->image('old-logo.png');
    $this->post(route('settings.certificates.upload-logo'), ['logo' => $oldFile]);

    $oldPath = CertificateSetting::getSetting(CertificateSetting::KEY_COMPANY_LOGO, null, $this->tenant->id);

    $newFile = UploadedFile::fake()->image('new-logo.png');
    $this->post(route('settings.certificates.upload-logo'), ['logo' => $newFile]);

    $newPath = CertificateSetting::getSetting(CertificateSetting::KEY_COMPANY_LOGO, null, $this->tenant->id);
    expect($newPath)->not->toBe($oldPath);
    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($newPath);
});

// ─── Upload Signature ───

test('can upload signature', function () {
    Storage::fake('public');

    $this->actingAs($this->user);

    $file = UploadedFile::fake()->image('signature.png', 200, 100);

    $response = $this->post(route('settings.certificates.upload-signature'), [
        'signature' => $file,
    ]);

    $response->assertSessionHas('success');

    $savedPaths = CertificateSetting::getSetting(CertificateSetting::KEY_SIGNATURE_PATHS, [], $this->tenant->id);
    expect($savedPaths)->toHaveKey('default');
    Storage::disk('public')->assertExists($savedPaths['default']);
});

test('validates signature is an image', function () {
    $this->actingAs($this->user);

    $response = $this->post(route('settings.certificates.upload-signature'), [
        'signature' => 'not-a-file',
    ]);

    $response->assertSessionHasErrors(['signature']);
});

// ─── Delete Logo ───

test('can delete logo', function () {
    Storage::fake('public');

    $file = UploadedFile::fake()->image('del-logo.png', 200, 200);
    $path = $file->store("tenants/{$this->tenant->id}/certificates/logos", 'public');

    CertificateSetting::setSetting(CertificateSetting::KEY_COMPANY_LOGO, $path, CertificateSetting::TYPE_GENERAL, false, $this->tenant->id);

    $this->actingAs($this->user);

    $response = $this->delete(route('settings.certificates.delete-logo'));

    $response->assertSessionHas('success');
    Storage::disk('public')->assertMissing($path);

    expect(CertificateSetting::getSetting(CertificateSetting::KEY_COMPANY_LOGO, null, $this->tenant->id))->toBeNull();
});

test('delete logo no-ops when no logo exists', function () {
    $this->actingAs($this->user);

    $response = $this->delete(route('settings.certificates.delete-logo'));

    $response->assertSessionHas('success');
});

// ─── Delete Signature ───

test('can delete signature', function () {
    Storage::fake('public');

    $file = UploadedFile::fake()->image('del-sig.png', 200, 100);
    $path = $file->store("tenants/{$this->tenant->id}/certificates/signatures", 'public');

    CertificateSetting::setSetting(CertificateSetting::KEY_SIGNATURE_PATHS, ['default' => $path], CertificateSetting::TYPE_SIGNATURE, true, $this->tenant->id);

    $this->actingAs($this->user);

    $response = $this->delete(route('settings.certificates.delete-signature'));

    $response->assertSessionHas('success');
    Storage::disk('public')->assertMissing($path);

    $savedPaths = CertificateSetting::getSetting(CertificateSetting::KEY_SIGNATURE_PATHS, [], $this->tenant->id);
    expect($savedPaths)->toBeEmpty();
});

// ─── Reset To Defaults ───

test('can reset certificate settings to defaults', function () {
    Storage::fake('public');

    $file = UploadedFile::fake()->image('reset-logo.png', 200, 200);
    $path = $file->store("tenants/{$this->tenant->id}/certificates/logos", 'public');

    CertificateSetting::setSetting(CertificateSetting::KEY_COMPANY_LOGO, $path, CertificateSetting::TYPE_GENERAL, false, $this->tenant->id);
    CertificateSetting::setSetting('auto_generate_on_policy_issue', true, CertificateSetting::TYPE_GENERAL, false, $this->tenant->id);

    $this->actingAs($this->user);

    $response = $this->post(route('settings.certificates.reset-defaults'));

    $response->assertSessionHas('success');
    Storage::disk('public')->assertMissing($path);

    $count = CertificateSetting::forTenant($this->tenant->id)->count();
    expect($count)->toBe(0);
});

// ─── Test Generation ───

test('can test certificate generation', function () {
    $this->actingAs($this->user);

    $response = $this->post(route('settings.certificates.test-generation'), [
        'template_key' => 'policy_certificate',
    ]);

    $response->assertSessionHas('success');
});

test('validates template key is required for test generation', function () {
    $this->actingAs($this->user);

    $response = $this->post(route('settings.certificates.test-generation'), []);

    $response->assertSessionHasErrors(['template_key']);
});

// ─── Authorization ───

test('requires manage_certificate_settings permission', function () {
    $userWithoutPermission = User::factory()->create([
        'tenant_id' => $this->tenant->id,
        'is_active' => true,
    ]);

    $this->actingAs($userWithoutPermission);

    $response = $this->get(route('settings.certificates'));
    $response->assertStatus(403);
});

test('requires authentication for certificate settings', function () {
    $response = $this->get(route('settings.certificates'));
    $response->assertStatus(302);
    $response->assertRedirectToRoute('login');
});
