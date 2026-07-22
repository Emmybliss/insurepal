<?php

use App\Models\Customer;
use App\Models\Policy;
use App\Models\PolicyClass;
use App\Models\PolicyProduct;
use App\Models\PolicyType;
use App\Models\Quote;
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
        'first_name' => 'Policy',
        'last_name' => 'Customer',
        'email' => 'policy.customer@test.com',
        'is_active' => true,
    ]);

    $this->policyType = PolicyType::create([
        'name' => 'Life Insurance',
        'code' => 'LIFE_001',
        'description' => 'Life insurance test type',
        'is_active' => true,
        'form_fields' => [],
        'base_premium' => 10000,
        'commission_rate' => 10,
        'sort_order' => 1,
    ]);

    $this->policyClass = PolicyClass::create([
        'policy_type_id' => $this->policyType->id,
        'name' => 'Term Life',
        'code' => 'TERM',
        'is_active' => true,
    ]);

    $this->policyProduct = PolicyProduct::create([
        'tenant_id' => $this->tenant->id,
        'policy_type_id' => $this->policyType->id,
        'policy_class_id' => $this->policyClass->id,
        'name' => 'Term Life Insurance',
        'code' => 'TERM_LIFE',
        'base_premium' => 5000.00,
        'commission_rate' => 10.00,
        'is_active' => true,
    ]);
});

function policyData($overrides = []): array
{
    return array_merge([
        'customer_id' => null,
        'policy_product_id' => null,
        'policy_type_id' => null,
        'policy_class_id' => null,
        'effective_date' => now()->toDateString(),
        'expiry_date' => now()->addYear()->toDateString(),
        'coverage_details' => [
            ['type' => 'basic', 'amount' => 100000, 'description' => 'Basic coverage'],
        ],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'sum_insured' => 100000,
        'payment_frequency' => 'annually',
    ], $overrides);
}

function makePolicy(Tenant $tenant, Customer $customer, PolicyProduct $product, PolicyType $type, PolicyClass $class, User $user, array $overrides = []): Policy
{
    return Policy::create(array_merge([
        'tenant_id' => $tenant->id,
        'customer_id' => $customer->id,
        'policy_product_id' => $product->id,
        'policy_type_id' => $type->id,
        'policy_class_id' => $class->id,
        'policy_number' => 'POL-'.fake()->unique()->numberBetween(100000, 999999),
        'source_type' => 'DIRECT_ISSUANCE',
        'status' => Policy::STATUS_DRAFT,
        'approval_status' => Policy::APPROVAL_PENDING,
        'effective_date' => now(),
        'expiry_date' => now()->addYear(),
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'sum_insured' => 100000.00,
        'created_by' => $user->id,
    ], $overrides));
}

// ─── List policies ───

test('can list policies via API', function () {
    makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user);

    $response = $this->getJson('/api/v1/policies');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'policy_number', 'status', 'premium_amount', 'total_amount', 'effective_date', 'expiry_date'],
            ],
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            'links',
        ]);
});

test('can search policies via API', function () {
    makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user, [
        'policy_number' => 'POL-999999',
    ]);

    $response = $this->getJson('/api/v1/policies?search=999999');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('can filter policies by status via API', function () {
    makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user, [
        'status' => 'draft',
    ]);

    $response = $this->getJson('/api/v1/policies?status=draft');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('can filter policies by approval_status via API', function () {
    makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user, [
        'approval_status' => 'pending',
    ]);

    $response = $this->getJson('/api/v1/policies?approval_status=pending');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('can filter policies by source_type via API', function () {
    makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user, [
        'source_type' => 'DIRECT_ISSUANCE',
    ]);

    $response = $this->getJson('/api/v1/policies?source_type=DIRECT_ISSUANCE');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('list policies respects tenant isolation via API', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    $otherCustomer = Customer::create(['tenant_id' => $otherTenant->id, 'type' => 'individual', 'first_name' => 'Other', 'last_name' => 'Cust', 'email' => 'other.c@test.com', 'is_active' => true]);

    makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user);
    Policy::withoutTenantScope()->create([
        'tenant_id' => $otherTenant->id,
        'customer_id' => $otherCustomer->id,
        'policy_product_id' => $this->policyProduct->id,
        'policy_number' => 'POL-999998',
        'source_type' => 'DIRECT_ISSUANCE',
        'status' => 'draft',
        'approval_status' => 'pending',
        'effective_date' => now(),
        'expiry_date' => now()->addYear(),
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'created_by' => $this->user->id,
    ]);

    $response = $this->getJson('/api/v1/policies');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

// ─── Create policy ───

test('can create a policy via API', function () {
    $data = policyData([
        'customer_id' => $this->customer->id,
        'policy_product_id' => $this->policyProduct->id,
        'policy_type_id' => $this->policyType->id,
        'policy_class_id' => $this->policyClass->id,
    ]);

    $response = $this->postJson('/api/v1/policies', $data);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'policy_number', 'status', 'premium_amount', 'total_amount']]);

    expect($response->json('data.status'))->toBe('draft');
    expect($response->json('data.source_type'))->toBe('DIRECT_ISSUANCE');
});

test('cannot create policy without required fields via API', function () {
    $response = $this->postJson('/api/v1/policies', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['customer_id', 'policy_product_id', 'effective_date', 'expiry_date', 'coverage_details', 'premium_amount', 'total_amount']);
});

// ─── Show policy ───

test('can show a policy via API', function () {
    $policy = makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user);

    $response = $this->getJson("/api/v1/policies/{$policy->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $policy->id)
        ->assertJsonPath('data.policy_number', $policy->policy_number);
});

test('cannot show policy from another tenant via API', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    $otherCustomer = Customer::create(['tenant_id' => $otherTenant->id, 'type' => 'individual', 'first_name' => 'Other', 'last_name' => 'Cust', 'email' => 'other.c@test.com', 'is_active' => true]);

    $policy = Policy::withoutTenantScope()->create([
        'tenant_id' => $otherTenant->id,
        'customer_id' => $otherCustomer->id,
        'policy_product_id' => $this->policyProduct->id,
        'policy_number' => 'POL-777777',
        'source_type' => 'DIRECT_ISSUANCE',
        'status' => 'draft',
        'approval_status' => 'pending',
        'effective_date' => now(),
        'expiry_date' => now()->addYear(),
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'created_by' => $this->user->id,
    ]);

    $response = $this->getJson("/api/v1/policies/{$policy->id}");

    $response->assertNotFound();
});

// ─── Update policy ───

test('can update a draft policy via API', function () {
    $policy = makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user);

    $response = $this->putJson("/api/v1/policies/{$policy->id}", [
        'notes' => 'Updated notes',
    ]);

    $response->assertOk();
    expect($policy->fresh()->notes)->toBe('Updated notes');
});

test('cannot update an active policy via API', function () {
    $policy = makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user, [
        'status' => Policy::STATUS_ACTIVE,
        'approval_status' => Policy::APPROVAL_APPROVED,
    ]);

    $response = $this->putJson("/api/v1/policies/{$policy->id}", [
        'notes' => 'Should fail',
    ]);

    $response->assertStatus(422);
});

// ─── Delete policy ───

test('can delete a draft policy via API', function () {
    $policy = makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user);

    $response = $this->deleteJson("/api/v1/policies/{$policy->id}");

    $response->assertOk();
    expect(Policy::find($policy->id))->toBeNull();
});

test('cannot delete an active policy via API', function () {
    $policy = makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user, [
        'status' => Policy::STATUS_ACTIVE,
        'approval_status' => Policy::APPROVAL_APPROVED,
    ]);

    $response = $this->deleteJson("/api/v1/policies/{$policy->id}");

    $response->assertStatus(422);
});

// ─── Workflow: Submit for approval ───

test('can submit draft policy for approval via API', function () {
    $policy = makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user);

    $response = $this->postJson("/api/v1/policies/{$policy->id}/submit-for-approval");

    $response->assertOk();
    expect($policy->fresh()->status)->toBe('pending_approval');
    expect($policy->fresh()->approval_status)->toBe('pending');
});

test('cannot submit non-draft policy for approval via API', function () {
    $policy = makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user, [
        'status' => Policy::STATUS_ACTIVE,
        'approval_status' => Policy::APPROVAL_APPROVED,
    ]);

    $response = $this->postJson("/api/v1/policies/{$policy->id}/submit-for-approval");

    $response->assertStatus(422);
});

// ─── Workflow: Approve ───

test('can approve a pending policy via API', function () {
    $policy = makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user, [
        'status' => Policy::STATUS_PENDING_APPROVAL,
        'approval_status' => Policy::APPROVAL_PENDING,
    ]);

    $response = $this->postJson("/api/v1/policies/{$policy->id}/approve", [
        'notes' => 'Looks good',
    ]);

    $response->assertOk();
    expect($policy->fresh()->status)->toBe('approved');
    expect($policy->fresh()->approval_status)->toBe('approved');
    expect($policy->fresh()->approved_by)->toBe($this->user->id);
});

test('cannot approve a draft policy via API', function () {
    $policy = makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user);

    $response = $this->postJson("/api/v1/policies/{$policy->id}/approve");

    $response->assertStatus(422);
});

// ─── Workflow: Reject ───

test('can reject a pending policy via API', function () {
    $policy = makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user, [
        'status' => Policy::STATUS_PENDING_APPROVAL,
        'approval_status' => Policy::APPROVAL_PENDING,
    ]);

    $response = $this->postJson("/api/v1/policies/{$policy->id}/reject", [
        'reason' => 'Inadequate coverage',
    ]);

    $response->assertOk();
    expect($policy->fresh()->status)->toBe('rejected');
    expect($policy->fresh()->approval_status)->toBe('rejected');
});

test('reject requires a reason via API', function () {
    $policy = makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user, [
        'status' => Policy::STATUS_PENDING_APPROVAL,
        'approval_status' => Policy::APPROVAL_PENDING,
    ]);

    $response = $this->postJson("/api/v1/policies/{$policy->id}/reject");

    $response->assertStatus(422);
});

// ─── Workflow: Issue ───

test('can issue an approved policy via API', function () {
    $policy = makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user, [
        'status' => Policy::STATUS_APPROVED,
        'approval_status' => Policy::APPROVAL_APPROVED,
    ]);

    $response = $this->postJson("/api/v1/policies/{$policy->id}/issue");

    $response->assertOk();
    expect($policy->fresh()->status)->toBe('active');
    expect($policy->fresh()->issued_at)->not->toBeNull();
});

test('cannot issue a draft policy via API', function () {
    $policy = makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user);

    $response = $this->postJson("/api/v1/policies/{$policy->id}/issue");

    $response->assertStatus(422);
});

// ─── Workflow: Cancel ───

test('can cancel an active policy via API', function () {
    $policy = makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user, [
        'status' => Policy::STATUS_ACTIVE,
        'approval_status' => Policy::APPROVAL_APPROVED,
    ]);

    $response = $this->postJson("/api/v1/policies/{$policy->id}/cancel", [
        'reason' => 'Customer requested cancellation',
    ]);

    $response->assertOk();
    expect($policy->fresh()->status)->toBe('cancelled');
});

// ─── Workflow: Suspend ───

test('can suspend an active policy via API', function () {
    $policy = makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user, [
        'status' => Policy::STATUS_ACTIVE,
        'approval_status' => Policy::APPROVAL_APPROVED,
    ]);

    $response = $this->postJson("/api/v1/policies/{$policy->id}/suspend", [
        'reason' => 'Payment issues',
    ]);

    $response->assertOk();
    expect($policy->fresh()->status)->toBe('suspended');
});

test('cannot suspend a draft policy via API', function () {
    $policy = makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user);

    $response = $this->postJson("/api/v1/policies/{$policy->id}/suspend");

    $response->assertStatus(422);
});

// ─── Workflow: Reinstate ───

test('can reinstate a suspended policy via API', function () {
    $policy = makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user, [
        'status' => Policy::STATUS_SUSPENDED,
        'approval_status' => Policy::APPROVAL_APPROVED,
    ]);

    $response = $this->postJson("/api/v1/policies/{$policy->id}/reinstate");

    $response->assertOk();
    expect($policy->fresh()->status)->toBe('active');
});

test('cannot reinstate an active policy via API', function () {
    $policy = makePolicy($this->tenant, $this->customer, $this->policyProduct, $this->policyType, $this->policyClass, $this->user, [
        'status' => Policy::STATUS_ACTIVE,
        'approval_status' => Policy::APPROVAL_APPROVED,
    ]);

    $response = $this->postJson("/api/v1/policies/{$policy->id}/reinstate");

    $response->assertStatus(422);
});

// ─── Workflow: Convert quote to policy ───

test('can convert quote to policy via API', function () {
    $insuranceProduct = \App\Models\InsuranceProduct::create([
        'name' => 'Quote Convert Product',
        'slug' => 'quote-convert',
        'type' => 'life',
        'description' => 'For quote conversion test',
        'form_fields' => [],
        'premium_rules' => [],
        'base_premium' => 5000.00,
        'is_active' => true,
    ]);

    $quote = Quote::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurance_product_id' => $insuranceProduct->id,
        'quote_number' => 'QT-CONV-001',
        'status' => 'accepted',
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'valid_until' => now()->addDays(30),
        'form_data' => [],
        'created_by' => $this->user->id,
        'accepted_at' => now(),
    ]);

    $response = $this->postJson('/api/v1/policies/convert-quote', [
        'quote_id' => $quote->id,
        'additional_data' => [
            'effective_date' => now()->toDateString(),
            'expiry_date' => now()->addYear()->toDateString(),
        ],
    ]);

    if ($response->status() !== 201) {
        dump($response->json());
    }

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'policy_number', 'status', 'quote' => ['id', 'quote_number']]]);
});
