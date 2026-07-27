<?php

use App\Models\Customer;
use App\Models\Policy;
use App\Models\Tenant;
use App\Models\User;
use App\Services\PolicyRecordPdfService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

beforeEach(function () {
    Permission::findOrCreate('view_policies', 'web');

    $this->tenant = Tenant::factory()->create();
    $this->user = User::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);
    $this->user->givePermissionTo('view_policies');

    $this->customer = Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john.doe@example.com',
        'phone' => '+2348000000000',
    ]);

    $this->policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'policy_number' => 'POL-REC-1001',
        'internal_reference' => 'REF-REC-1001',
        'premium_amount' => 150000.00,
        'commission_amount' => 15000.00,
        'sum_insured' => 5000000.00,
        'status' => 'active',
        'approval_status' => 'approved',
        'effective_date' => now()->format('Y-m-d'),
        'expiry_date' => now()->addYear()->format('Y-m-d'),
    ]);
});

it('maps policy payload accurately with all essential sections', function () {
    $service = app(PolicyRecordPdfService::class);
    $payload = $service->mapPayload($this->policy, $this->user);

    expect($payload['policy_number'])->toBe('POL-REC-1001');
    expect($payload['gross_premium'])->toBe(150000.00);
    expect($payload['commission_amount'])->toBe(15000.00);
    expect($payload['sum_insured'])->toBe(5000000.00);
    expect($payload['customer_name'])->toContain('John');
    expect($payload['customer_email'])->toBe('john.doe@example.com');
    expect($payload['generated_by'])->toBe($this->user->name);
    expect($payload['timeline'])->toBeArray();
});

it('renders HTML preview for policy record with all required section markers', function () {
    $response = $this->actingAs($this->user)
        ->get(route('policy-management.record.html-preview', $this->policy));

    $response->assertSuccessful();
    $response->assertHeader('Content-Type', 'text/html; charset=UTF-8');

    $html = $response->getContent();
    expect($html)->toContain('POLICY RECORD SUMMARY');
    expect($html)->toContain('1. Policy Overview');
    expect($html)->toContain('2. Customer Information');
    expect($html)->toContain('3. Insurance & Risk Details');
    expect($html)->toContain('5. Financial Summary');
    expect($html)->toContain('12. Audit Trail & Verification');
    expect($html)->toContain('POL-REC-1001');
});

it('allows previewing Policy Record PDF binary', function () {
    $response = $this->actingAs($this->user)
        ->get(route('policy-management.record.preview', $this->policy));

    $response->assertSuccessful();
    $response->assertHeader('Content-Type', 'application/pdf');
    expect($response->headers->get('Content-Disposition'))->toContain('inline');
});

it('allows downloading Policy Record PDF binary', function () {
    $response = $this->actingAs($this->user)
        ->get(route('policy-management.record.download', $this->policy));

    $response->assertSuccessful();
    $response->assertHeader('Content-Type', 'application/pdf');
    expect($response->headers->get('Content-Disposition'))->toContain('attachment');
});

it('denies access to policy record PDF for unauthorized tenant user', function () {
    $otherTenant = Tenant::factory()->create();
    $otherUser = User::factory()->create(['tenant_id' => $otherTenant->id]);
    $otherUser->givePermissionTo('view_policies');

    $response = $this->actingAs($otherUser)
        ->get(route('policy-management.record.preview', $this->policy));

    $response->assertForbidden();
});
