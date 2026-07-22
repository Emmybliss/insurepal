<?php

use App\Models\Claim;
use App\Models\Customer;
use App\Models\Policy;
use App\Models\PolicyClass;
use App\Models\PolicyProduct;
use App\Models\PolicyType;
use App\Models\Tenant;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::create(['name' => 'customer', 'guard_name' => 'web']);

    $this->tenant = Tenant::create([
        'name' => 'Test Broker',
        'type' => 'broker',
        'status' => 'active',
        'onboarding_completed' => true,
        'email' => 'broker@test.com',
    ]);

    app()->instance('tenant', $this->tenant);

    $this->user = User::create([
        'name' => 'Staff User',
        'email' => 'staff@test.com',
        'email_verified_at' => now(),
        'password' => bcrypt('password'),
        'tenant_id' => $this->tenant->id,
        'is_active' => true,
    ]);

    $this->token = $this->user->createToken('test-token')->plainTextToken;
    $this->withHeaders(['Authorization' => 'Bearer '.$this->token]);

    $this->customer = Customer::create([
        'tenant_id' => $this->tenant->id,
        'type' => 'individual',
        'first_name' => 'Claim',
        'last_name' => 'Customer',
        'email' => 'claim.customer@test.com',
        'is_active' => true,
    ]);

    $this->policyType = PolicyType::create([
        'name' => 'Life Insurance',
        'code' => 'LIFE_CLAIM',
        'description' => 'Life insurance for claim tests',
        'is_active' => true,
        'form_fields' => [],
        'base_premium' => 10000,
        'commission_rate' => 10,
        'sort_order' => 1,
    ]);

    $this->policyClass = PolicyClass::create([
        'policy_type_id' => $this->policyType->id,
        'name' => 'Term Life',
        'code' => 'TERM_CLM',
        'is_active' => true,
    ]);

    $this->policyProduct = PolicyProduct::create([
        'tenant_id' => $this->tenant->id,
        'policy_type_id' => $this->policyType->id,
        'policy_class_id' => $this->policyClass->id,
        'name' => 'Term Life Claim Test',
        'code' => 'TERM_LIFE_CLM',
        'base_premium' => 5000.00,
        'commission_rate' => 10.00,
        'is_active' => true,
    ]);

    $this->policy = Policy::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'policy_product_id' => $this->policyProduct->id,
        'policy_type_id' => $this->policyType->id,
        'policy_class_id' => $this->policyClass->id,
        'policy_number' => 'POL-CLM-001',
        'source_type' => 'DIRECT_ISSUANCE',
        'status' => Policy::STATUS_ACTIVE,
        'approval_status' => Policy::APPROVAL_APPROVED,
        'effective_date' => now()->subMonths(6),
        'expiry_date' => now()->addMonths(6),
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'sum_insured' => 100000.00,
        'created_by' => $this->user->id,
    ]);
});

function makeClaim(Tenant $tenant, Customer $customer, Policy $policy, User $user, array $overrides = []): Claim
{
    return Claim::create(array_merge([
        'tenant_id' => $tenant->id,
        'policy_id' => $policy->id,
        'customer_id' => $customer->id,
        'claim_reference' => Claim::generateClaimReference($tenant->id),
        'claim_type' => Claim::TYPE_ACCIDENT,
        'incident_date' => now()->subDays(5),
        'incident_description' => 'Test incident description for claim testing purposes.',
        'incident_location' => '123 Test Street, Test City',
        'claim_amount' => 25000.00,
        'status' => Claim::STATUS_DRAFT,
    ], $overrides));
}

// ─── List claims ───

test('can list claims via API', function () {
    makeClaim($this->tenant, $this->customer, $this->policy, $this->user);

    $response = $this->getJson('/api/v1/claims');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'claim_reference', 'status', 'claim_type', 'claim_amount', 'incident_date'],
            ],
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            'links',
        ]);
});

test('can search claims via API', function () {
    makeClaim($this->tenant, $this->customer, $this->policy, $this->user, [
        'claim_reference' => 'CLM-SEARCH-001',
    ]);

    $response = $this->getJson('/api/v1/claims?search=SEARCH');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('can filter claims by status via API', function () {
    makeClaim($this->tenant, $this->customer, $this->policy, $this->user);

    $response = $this->getJson('/api/v1/claims?status=draft');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('can filter claims by claim_type via API', function () {
    makeClaim($this->tenant, $this->customer, $this->policy, $this->user);

    $response = $this->getJson('/api/v1/claims?claim_type=accident');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('can filter claims by customer_id via API', function () {
    makeClaim($this->tenant, $this->customer, $this->policy, $this->user);

    $response = $this->getJson('/api/v1/claims?customer_id='.$this->customer->id);

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('can filter claims by policy_id via API', function () {
    makeClaim($this->tenant, $this->customer, $this->policy, $this->user);

    $response = $this->getJson('/api/v1/claims?policy_id='.$this->policy->id);

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('can filter claims by date range via API', function () {
    makeClaim($this->tenant, $this->customer, $this->policy, $this->user);

    $response = $this->getJson('/api/v1/claims?date_from='.now()->subMonth()->toDateString().'&date_to='.now()->toDateString());

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('list claims respects tenant isolation via API', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    $otherCustomer = Customer::create(['tenant_id' => $otherTenant->id, 'type' => 'individual', 'first_name' => 'Other', 'last_name' => 'Cust', 'email' => 'other.c@test.com', 'is_active' => true]);
    $otherPolicy = Policy::create([
        'tenant_id' => $otherTenant->id,
        'customer_id' => $otherCustomer->id,
        'policy_product_id' => $this->policyProduct->id,
        'policy_number' => 'POL-OTHER-001',
        'source_type' => 'DIRECT_ISSUANCE',
        'status' => Policy::STATUS_ACTIVE,
        'approval_status' => Policy::APPROVAL_APPROVED,
        'effective_date' => now()->subMonths(3),
        'expiry_date' => now()->addMonths(9),
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'created_by' => $this->user->id,
    ]);

    makeClaim($this->tenant, $this->customer, $this->policy, $this->user);

    Claim::withoutTenantScope()->create([
        'tenant_id' => $otherTenant->id,
        'policy_id' => $otherPolicy->id,
        'customer_id' => $otherCustomer->id,
        'claim_reference' => 'CLM-OTHER-001',
        'claim_type' => Claim::TYPE_THEFT,
        'incident_date' => now()->subDays(3),
        'incident_description' => 'Other tenant claim description.',
        'claim_amount' => 5000.00,
        'status' => Claim::STATUS_DRAFT,
    ]);

    $response = $this->getJson('/api/v1/claims');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

// ─── Create claim ───

test('can create a claim via API', function () {
    $response = $this->postJson('/api/v1/claims', [
        'policy_id' => $this->policy->id,
        'customer_id' => $this->customer->id,
        'claim_type' => Claim::TYPE_ACCIDENT,
        'incident_date' => now()->subDays(3)->toDateString(),
        'incident_description' => 'Vehicle accident at intersection with injuries.',
        'incident_location' => '456 Oak Avenue, Metropolis',
        'claim_amount' => 15000.00,
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'claim_reference', 'status', 'claim_type', 'claim_amount']]);

    expect($response->json('data.status'))->toBe('draft');
    expect($response->json('data.claim_type'))->toBe('accident');
});

test('cannot create claim without required fields via API', function () {
    $response = $this->postJson('/api/v1/claims', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['policy_id', 'customer_id', 'claim_type', 'incident_date', 'incident_description', 'claim_amount']);
});

// ─── Show claim ───

test('can show a claim via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user);

    $response = $this->getJson("/api/v1/claims/{$claim->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $claim->id)
        ->assertJsonPath('data.claim_reference', $claim->claim_reference);
});

test('cannot show claim from another tenant via API', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    $otherCustomer = Customer::create(['tenant_id' => $otherTenant->id, 'type' => 'individual', 'first_name' => 'Other', 'last_name' => 'Cust', 'email' => 'other.c@test.com', 'is_active' => true]);
    $otherPolicy = Policy::create([
        'tenant_id' => $otherTenant->id,
        'customer_id' => $otherCustomer->id,
        'policy_product_id' => $this->policyProduct->id,
        'policy_number' => 'POL-OTHER-002',
        'source_type' => 'DIRECT_ISSUANCE',
        'status' => Policy::STATUS_ACTIVE,
        'approval_status' => Policy::APPROVAL_APPROVED,
        'effective_date' => now()->subMonths(3),
        'expiry_date' => now()->addMonths(9),
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'created_by' => $this->user->id,
    ]);

    $claim = Claim::withoutTenantScope()->create([
        'tenant_id' => $otherTenant->id,
        'policy_id' => $otherPolicy->id,
        'customer_id' => $otherCustomer->id,
        'claim_reference' => 'CLM-FORBIDDEN',
        'claim_type' => Claim::TYPE_DAMAGE,
        'incident_date' => now()->subDays(2),
        'incident_description' => 'Property damage claim from other tenant.',
        'claim_amount' => 8000.00,
        'status' => Claim::STATUS_DRAFT,
    ]);

    $response = $this->getJson("/api/v1/claims/{$claim->id}");

    $response->assertNotFound();
});

// ─── Update claim ───

test('can update a draft claim via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user);

    $response = $this->putJson("/api/v1/claims/{$claim->id}", [
        'incident_description' => 'Updated incident description with more details for the claim.',
        'claim_amount' => 30000.00,
    ]);

    $response->assertOk();
    expect($claim->fresh()->incident_description)->toBe('Updated incident description with more details for the claim.');
    expect((float) $claim->fresh()->claim_amount)->toBe(30000.00);
});

test('cannot update a submitted claim via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user, [
        'status' => Claim::STATUS_SUBMITTED,
        'submitted_by' => $this->user->id,
        'submitted_at' => now(),
    ]);

    $response = $this->putJson("/api/v1/claims/{$claim->id}", [
        'incident_description' => 'Should not update.',
    ]);

    $response->assertStatus(422);
});

// ─── Delete claim ───

test('can delete a draft claim via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user);

    $response = $this->deleteJson("/api/v1/claims/{$claim->id}");

    $response->assertOk();
    expect(Claim::find($claim->id))->toBeNull();
});

test('cannot delete a submitted claim via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user, [
        'status' => Claim::STATUS_SUBMITTED,
        'submitted_by' => $this->user->id,
        'submitted_at' => now(),
    ]);

    $response = $this->deleteJson("/api/v1/claims/{$claim->id}");

    $response->assertStatus(422);
});

// ─── Workflow: Submit ───

test('can submit a draft claim via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/submit");

    $response->assertOk();
    expect($claim->fresh()->status)->toBe(Claim::STATUS_SUBMITTED);
    expect($claim->fresh()->submitted_by)->toBe($this->user->id);
    expect($claim->fresh()->submitted_at)->not->toBeNull();
});

test('cannot submit a non-draft claim via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user, [
        'status' => Claim::STATUS_SUBMITTED,
        'submitted_by' => $this->user->id,
        'submitted_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/submit");

    $response->assertStatus(422);
});

// ─── Workflow: Start Review ───

test('can start review of a submitted claim via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user, [
        'status' => Claim::STATUS_SUBMITTED,
        'submitted_by' => $this->user->id,
        'submitted_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/start-review");

    $response->assertOk();
    expect($claim->fresh()->status)->toBe(Claim::STATUS_UNDER_REVIEW);
    expect($claim->fresh()->reviewer_id)->toBe($this->user->id);
});

test('cannot start review of a draft claim via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/start-review");

    $response->assertStatus(422);
});

// ─── Workflow: Approve ───

test('can approve a claim under review via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user, [
        'status' => Claim::STATUS_UNDER_REVIEW,
        'reviewer_id' => $this->user->id,
        'reviewed_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/approve", [
        'approved_amount' => 20000.00,
        'decision_notes' => 'Claim approved after verification.',
    ]);

    $response->assertOk();
    expect($claim->fresh()->status)->toBe(Claim::STATUS_APPROVED);
    expect((float) $claim->fresh()->approved_amount)->toBe(20000.00);
});

test('cannot approve without approved_amount via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user, [
        'status' => Claim::STATUS_UNDER_REVIEW,
        'reviewer_id' => $this->user->id,
        'reviewed_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/approve");

    $response->assertStatus(422);
});

test('approved amount cannot exceed claim amount via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user, [
        'status' => Claim::STATUS_UNDER_REVIEW,
        'reviewer_id' => $this->user->id,
        'reviewed_at' => now(),
        'claim_amount' => 10000.00,
    ]);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/approve", [
        'approved_amount' => 999999.00,
    ]);

    $response->assertStatus(422);
});

test('cannot approve a draft claim via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/approve", [
        'approved_amount' => 5000.00,
    ]);

    $response->assertStatus(422);
});

// ─── Workflow: Reject ───

test('can reject a claim under review via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user, [
        'status' => Claim::STATUS_UNDER_REVIEW,
        'reviewer_id' => $this->user->id,
        'reviewed_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/reject", [
        'decision_notes' => 'Claim rejected due to insufficient evidence.',
    ]);

    $response->assertOk();
    expect($claim->fresh()->status)->toBe(Claim::STATUS_REJECTED);
});

test('reject requires decision_notes via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user, [
        'status' => Claim::STATUS_UNDER_REVIEW,
        'reviewer_id' => $this->user->id,
        'reviewed_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/reject");

    $response->assertStatus(422);
});

// ─── Workflow: Request Info ───

test('can request additional info on a claim via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user, [
        'status' => Claim::STATUS_UNDER_REVIEW,
        'reviewer_id' => $this->user->id,
        'reviewed_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/request-info", [
        'message' => 'Please provide police report and repair estimates.',
    ]);

    $response->assertOk();
    expect($claim->fresh()->status)->toBe(Claim::STATUS_INFO_REQUESTED);
});

test('request-info requires a message via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user, [
        'status' => Claim::STATUS_UNDER_REVIEW,
        'reviewer_id' => $this->user->id,
        'reviewed_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/request-info");

    $response->assertStatus(422);
});

// ─── Workflow: Settle ───

test('can settle an approved claim via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user, [
        'status' => Claim::STATUS_APPROVED,
        'approved_amount' => 20000.00,
        'approved_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/settle", [
        'notes' => 'Payment processed successfully.',
    ]);

    $response->assertOk();
    expect($claim->fresh()->status)->toBe(Claim::STATUS_SETTLED);
});

test('cannot settle a draft claim via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/settle");

    $response->assertStatus(422);
});

// ─── Workflow: Close ───

test('can close a settled claim via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user, [
        'status' => Claim::STATUS_SETTLED,
        'settled_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/close", [
        'notes' => 'Claim file closed.',
    ]);

    $response->assertOk();
    expect($claim->fresh()->status)->toBe(Claim::STATUS_CLOSED);
});

test('can close a rejected claim via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user, [
        'status' => Claim::STATUS_REJECTED,
        'rejected_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/close");

    $response->assertOk();
    expect($claim->fresh()->status)->toBe(Claim::STATUS_CLOSED);
});

test('cannot close a draft claim via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/close");

    $response->assertStatus(422);
});

// ─── Comments ───

test('can add a comment to a claim via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/comments", [
        'body' => 'This is a test comment on the claim.',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.body', 'This is a test comment on the claim.');

    expect($claim->fresh()->comments()->count())->toBe(1);
});

test('can add an internal comment via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/comments", [
        'body' => 'Internal note for adjuster.',
        'is_internal' => true,
    ]);

    $response->assertCreated();
    expect($response->json('data.is_internal'))->toBeTrue();
});

test('cannot add comment without body via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user);

    $response = $this->postJson("/api/v1/claims/{$claim->id}/comments", []);

    $response->assertStatus(422);
});

// ─── Activity Logging ───

test('claim activities are logged on status changes via API', function () {
    $claim = makeClaim($this->tenant, $this->customer, $this->policy, $this->user);

    $this->postJson("/api/v1/claims/{$claim->id}/submit");
    $this->postJson("/api/v1/claims/{$claim->id}/start-review");

    expect($claim->fresh()->activities()->count())->toBe(2); // submitted + review_started
});
