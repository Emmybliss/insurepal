<?php

use App\Models\Policy;
use App\Models\PolicyCertificate;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
});

it('can create a PolicyCertificate record', function () {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->create(['tenant_id' => $tenant->id]);
    $policy = Policy::factory()->create(['tenant_id' => $tenant->id]);

    $certificate = PolicyCertificate::create([
        'tenant_id' => $tenant->id,
        'policy_id' => $policy->id,
        'certificate_number' => PolicyCertificate::generateCertificateNumber($tenant->id),
        'type' => PolicyCertificate::TYPE_POLICY_CERTIFICATE,
        'status' => PolicyCertificate::STATUS_DRAFT,
        'certificate_data' => [],
    ]);

    expect($certificate)->toBeInstanceOf(PolicyCertificate::class);
    expect($certificate->status)->toBe(PolicyCertificate::STATUS_DRAFT);
    expect($certificate->type)->toBe(PolicyCertificate::TYPE_POLICY_CERTIFICATE);
    expect($certificate->certificate_number)->toStartWith('CERT-');
});

it('can mark certificate as generated', function () {
    $tenant = Tenant::factory()->create();
    $policy = Policy::factory()->create(['tenant_id' => $tenant->id]);

    $certificate = PolicyCertificate::create([
        'tenant_id' => $tenant->id,
        'policy_id' => $policy->id,
        'certificate_number' => PolicyCertificate::generateCertificateNumber($tenant->id),
        'type' => PolicyCertificate::TYPE_POLICY_CERTIFICATE,
        'status' => PolicyCertificate::STATUS_DRAFT,
        'certificate_data' => [],
    ]);

    $file = UploadedFile::fake()->create('test.pdf', 1024);
    $path = $file->storeAs("certificates/{$tenant->id}/pdfs", 'test-cert.pdf', 'public');

    $certificate->markAsGenerated($path, ['source' => 'test']);

    expect($certificate->status)->toBe(PolicyCertificate::STATUS_GENERATED);
    expect($certificate->file_path)->toBe($path);
    expect($certificate->generated_at)->not->toBeNull();
    expect($certificate->generation_metadata)->toBe(['source' => 'test']);
});

it('can issue a generated certificate', function () {
    $tenant = Tenant::factory()->create();
    $policy = Policy::factory()->create(['tenant_id' => $tenant->id]);

    $certificate = PolicyCertificate::create([
        'tenant_id' => $tenant->id,
        'policy_id' => $policy->id,
        'certificate_number' => PolicyCertificate::generateCertificateNumber($tenant->id),
        'type' => PolicyCertificate::TYPE_POLICY_CERTIFICATE,
        'status' => PolicyCertificate::STATUS_GENERATED,
        'generated_at' => now(),
        'certificate_data' => [],
    ]);

    $certificate->markAsIssued('Issued to customer');

    expect($certificate->status)->toBe(PolicyCertificate::STATUS_ISSUED);
    expect($certificate->issued_at)->not->toBeNull();
});

it('can cancel a certificate', function () {
    $tenant = Tenant::factory()->create();
    $policy = Policy::factory()->create(['tenant_id' => $tenant->id]);

    $certificate = PolicyCertificate::create([
        'tenant_id' => $tenant->id,
        'policy_id' => $policy->id,
        'certificate_number' => PolicyCertificate::generateCertificateNumber($tenant->id),
        'type' => PolicyCertificate::TYPE_POLICY_CERTIFICATE,
        'status' => PolicyCertificate::STATUS_GENERATED,
        'generated_at' => now(),
        'certificate_data' => [],
    ]);

    $certificate->markAsCancelled('Test cancellation');

    expect($certificate->status)->toBe(PolicyCertificate::STATUS_CANCELLED);
});

it('validates canBeIssued only in generated status', function () {
    $tenant = Tenant::factory()->create();
    $policy = Policy::factory()->create(['tenant_id' => $tenant->id]);

    $draft = PolicyCertificate::create([
        'tenant_id' => $tenant->id,
        'policy_id' => $policy->id,
        'certificate_number' => PolicyCertificate::generateCertificateNumber($tenant->id),
        'type' => PolicyCertificate::TYPE_POLICY_CERTIFICATE,
        'status' => PolicyCertificate::STATUS_DRAFT,
        'certificate_data' => [],
    ]);

    expect($draft->canBeIssued())->toBeFalse();
    expect($draft->canBeGenerated())->toBeTrue();

    $draft->markAsGenerated(null, ['test' => true]);

    expect($draft->canBeIssued())->toBeTrue();
});
