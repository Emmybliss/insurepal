<?php

use App\Enums\BrokerSlipStatus;
use App\Enums\PlacementStatus;
use App\Models\BrokerSlip;
use App\Models\BrokerSlipApproval;
use App\Models\BrokerSlipClause;
use App\Models\BrokerSlipRisk;
use App\Models\Customer;
use App\Models\InsuranceCompany;
use App\Models\Placement;
use App\Models\PlacementMarket;
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
        'first_name' => 'BS',
        'last_name' => 'Customer',
        'email' => 'bs.customer@test.com',
        'is_active' => true,
    ]);

    $this->policyType = PolicyType::create([
        'name' => 'General Insurance',
        'code' => 'GEN_BS',
        'description' => 'General insurance for broker slip tests',
        'is_active' => true,
        'form_fields' => [],
        'base_premium' => 10000,
        'commission_rate' => 10,
        'sort_order' => 1,
    ]);

    $this->policyClass = PolicyClass::create([
        'policy_type_id' => $this->policyType->id,
        'name' => 'Standard',
        'code' => 'STD_BS',
        'is_active' => true,
    ]);

    $this->policyProduct = PolicyProduct::create([
        'tenant_id' => $this->tenant->id,
        'policy_type_id' => $this->policyType->id,
        'policy_class_id' => $this->policyClass->id,
        'name' => 'Standard Coverage BS',
        'code' => 'STD_COV_BS',
        'base_premium' => 5000.00,
        'commission_rate' => 10.00,
        'is_active' => true,
    ]);

    $this->insuranceCompany = InsuranceCompany::create([
        'name' => 'Test Insurer BS',
        'company_type' => 'underwriter',
        'email' => 'insurer.bs@test.com',
        'is_active' => true,
    ]);

    $this->placement = Placement::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'policy_product_id' => $this->policyProduct->id,
        'proposed_start_date' => now()->toDateString(),
        'proposed_end_date' => now()->addYear()->toDateString(),
        'total_sum_insured' => 100000.00,
        'status' => PlacementStatus::Draft->value,
        'created_by' => $this->user->id,
    ]);

    $this->market = PlacementMarket::create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $this->placement->id,
        'insurance_company_id' => $this->insuranceCompany->id,
        'is_lead' => true,
        'status' => 'pending',
    ]);
});

function makeBrokerSlip(Tenant $tenant, Placement $placement, User $user, array $overrides = []): BrokerSlip
{
    return BrokerSlip::create(array_merge([
        'tenant_id' => $tenant->id,
        'placement_id' => $placement->id,
        'currency' => 'NGN',
        'sum_insured' => 100000.00,
        'gross_premium' => 15000.00,
        'net_premium' => 12000.00,
        'period_start' => now()->toDateString(),
        'period_end' => now()->addYear()->toDateString(),
        'status' => BrokerSlipStatus::Draft->value,
        'created_by' => $user->id,
    ], $overrides));
}

// ─── List broker slips ───

test('can list broker slips via API', function () {
    makeBrokerSlip($this->tenant, $this->placement, $this->user);

    $response = $this->getJson('/api/v1/broker-slips');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'slip_number', 'version', 'status', 'sum_insured'],
            ],
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            'links',
        ]);
});

test('can filter broker slips by status via API', function () {
    makeBrokerSlip($this->tenant, $this->placement, $this->user);

    $response = $this->getJson('/api/v1/broker-slips?status=draft');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('list broker slips respects tenant isolation via API', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    $otherCustomer = Customer::create(['tenant_id' => $otherTenant->id, 'type' => 'individual', 'first_name' => 'Other', 'last_name' => 'Cust', 'email' => 'other.c@test.com', 'is_active' => true]);
    $otherPlacement = Placement::withoutTenantScope()->create([
        'placement_number' => 'PL-OTHER-BS-001',
        'tenant_id' => $otherTenant->id,
        'customer_id' => $otherCustomer->id,
        'policy_product_id' => $this->policyProduct->id,
        'proposed_start_date' => now()->toDateString(),
        'proposed_end_date' => now()->addYear()->toDateString(),
        'total_sum_insured' => 50000.00,
        'status' => PlacementStatus::Draft->value,
        'created_by' => $this->user->id,
    ]);

    makeBrokerSlip($this->tenant, $this->placement, $this->user);

    BrokerSlip::withoutTenantScope()->create([
        'slip_number' => 'BS/OTHER/000001',
        'tenant_id' => $otherTenant->id,
        'placement_id' => $otherPlacement->id,
        'currency' => 'NGN',
        'sum_insured' => 50000.00,
        'gross_premium' => 7500.00,
        'net_premium' => 6000.00,
        'period_start' => now()->toDateString(),
        'period_end' => now()->addYear()->toDateString(),
        'status' => BrokerSlipStatus::Draft->value,
        'created_by' => $this->user->id,
    ]);

    $response = $this->getJson('/api/v1/broker-slips');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

// ─── Create broker slip ───

test('can create a broker slip via API', function () {
    $response = $this->postJson('/api/v1/broker-slips', [
        'placement_id' => $this->placement->id,
        'placement_market_id' => $this->market->id,
        'currency' => 'NGN',
        'period_start' => now()->toDateString(),
        'period_end' => now()->addYear()->toDateString(),
        'risks' => [
            ['item_type' => 'property', 'description' => 'Test risk', 'coverage_amount' => 200000.00, 'premium' => 30000.00, 'net_premium' => 25000.00],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'slip_number', 'status', 'sum_insured']]);

    expect($response->json('data.status'))->toBe('draft');
});

test('can create a broker slip with items and clauses via API', function () {
    $response = $this->postJson('/api/v1/broker-slips', [
        'placement_id' => $this->placement->id,
        'currency' => 'NGN',
        'period_start' => now()->toDateString(),
        'period_end' => now()->addYear()->toDateString(),
        'risks' => [
            ['item_type' => 'building', 'description' => 'Main office building', 'coverage_amount' => 300000.00, 'premium' => 30000.00, 'net_premium' => 25000.00],
            ['item_type' => 'contents', 'description' => 'Office contents', 'coverage_amount' => 200000.00, 'premium' => 20000.00, 'net_premium' => 17000.00],
        ],
        'clauses' => [
            ['clause_type' => 'warranty', 'title' => 'Security Warranty', 'content' => 'Insured must maintain 24hr security.'],
        ],
    ]);

    $response->assertCreated();
    expect(BrokerSlipRisk::where('broker_slip_id', $response->json('data.id'))->count())->toBe(2);
    expect(BrokerSlipClause::where('broker_slip_id', $response->json('data.id'))->count())->toBe(1);
});

test('cannot create broker slip without required fields via API', function () {
    $response = $this->postJson('/api/v1/broker-slips', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['placement_id', 'period_start', 'period_end']);
});

// ─── Show broker slip ───

test('can show a broker slip via API', function () {
    $slip = makeBrokerSlip($this->tenant, $this->placement, $this->user);

    $response = $this->getJson("/api/v1/broker-slips/{$slip->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $slip->id)
        ->assertJsonPath('data.slip_number', $slip->slip_number);
});

test('cannot show broker slip from another tenant via API', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);

    $slip = BrokerSlip::withoutTenantScope()->create([
        'tenant_id' => $otherTenant->id,
        'placement_id' => $this->placement->id,
        'currency' => 'NGN',
        'sum_insured' => 50000.00,
        'gross_premium' => 7500.00,
        'net_premium' => 6000.00,
        'period_start' => now()->toDateString(),
        'period_end' => now()->addYear()->toDateString(),
        'status' => BrokerSlipStatus::Draft->value,
        'created_by' => $this->user->id,
    ]);

    $response = $this->getJson("/api/v1/broker-slips/{$slip->id}");

    $response->assertNotFound();
});

// ─── Update broker slip ───

test('can update a draft broker slip via API', function () {
    $slip = makeBrokerSlip($this->tenant, $this->placement, $this->user);

    $response = $this->putJson("/api/v1/broker-slips/{$slip->id}", [
        'risks' => [
            ['item_type' => 'building', 'description' => 'Main office building', 'coverage_amount' => 350000.00, 'premium' => 50000.00, 'net_premium' => 40000.00],
        ],
    ]);

    $response->assertOk();
    expect((float) $slip->fresh()->load('risks')->sum_insured)->toBe(350000.00);
});

test('cannot update an issued broker slip via API', function () {
    $slip = makeBrokerSlip($this->tenant, $this->placement, $this->user, [
        'status' => BrokerSlipStatus::Issued->value,
        'issued_at' => now(),
        'issued_by' => $this->user->id,
    ]);

    $response = $this->putJson("/api/v1/broker-slips/{$slip->id}", [
        'risks' => [
            ['item_type' => 'property', 'description' => 'Updated risk', 'coverage_amount' => 999999.00, 'premium' => 50000.00, 'net_premium' => 40000.00],
        ],
    ]);

    $response->assertStatus(422);
});

// ─── Delete broker slip ───

test('can delete a draft broker slip via API', function () {
    $slip = makeBrokerSlip($this->tenant, $this->placement, $this->user);

    $response = $this->deleteJson("/api/v1/broker-slips/{$slip->id}");

    $response->assertOk();
    expect(BrokerSlip::find($slip->id))->toBeNull();
});

test('cannot delete a non-draft broker slip via API', function () {
    $slip = makeBrokerSlip($this->tenant, $this->placement, $this->user, [
        'status' => BrokerSlipStatus::PendingReview->value,
    ]);

    $response = $this->deleteJson("/api/v1/broker-slips/{$slip->id}");

    $response->assertStatus(422);
});

// ─── Workflow: Submit for Review ───

test('can submit a draft broker slip for review via API', function () {
    $slip = makeBrokerSlip($this->tenant, $this->placement, $this->user);

    $response = $this->postJson("/api/v1/broker-slips/{$slip->id}/submit-for-review", [
        'notes' => 'Please review this slip.',
    ]);

    $response->assertOk();
    expect($slip->fresh()->status)->toBe(BrokerSlipStatus::PendingReview->value);
    expect($slip->fresh()->approvals()->count())->toBe(1);
});

test('cannot submit a non-draft broker slip for review via API', function () {
    $slip = makeBrokerSlip($this->tenant, $this->placement, $this->user, [
        'status' => BrokerSlipStatus::Issued->value,
    ]);

    $response = $this->postJson("/api/v1/broker-slips/{$slip->id}/submit-for-review");

    $response->assertStatus(422);
});

// ─── Workflow: Approve ───

test('can approve a broker slip pending review via API', function () {
    $slip = makeBrokerSlip($this->tenant, $this->placement, $this->user, [
        'status' => BrokerSlipStatus::PendingReview->value,
    ]);
    BrokerSlipApproval::create([
        'tenant_id' => $this->tenant->id,
        'broker_slip_id' => $slip->id,
        'requested_by' => $this->user->id,
        'status' => BrokerSlipApproval::STATUS_PENDING,
    ]);

    $response = $this->postJson("/api/v1/broker-slips/{$slip->id}/approve", [
        'notes' => 'Approved with standard terms.',
    ]);

    $response->assertOk();
    expect($slip->fresh()->status)->toBe(BrokerSlipStatus::Approved->value);
});

test('cannot approve a draft broker slip via API', function () {
    $slip = makeBrokerSlip($this->tenant, $this->placement, $this->user);

    $response = $this->postJson("/api/v1/broker-slips/{$slip->id}/approve");

    $response->assertStatus(422);
});

// ─── Workflow: Request Changes ───

test('can request changes on a broker slip pending review via API', function () {
    $slip = makeBrokerSlip($this->tenant, $this->placement, $this->user, [
        'status' => BrokerSlipStatus::PendingReview->value,
    ]);
    BrokerSlipApproval::create([
        'tenant_id' => $this->tenant->id,
        'broker_slip_id' => $slip->id,
        'requested_by' => $this->user->id,
        'status' => BrokerSlipApproval::STATUS_PENDING,
    ]);

    $response = $this->postJson("/api/v1/broker-slips/{$slip->id}/request-changes", [
        'changes' => 'Please update the premium calculation and add fire clause.',
    ]);

    $response->assertOk();
    expect($slip->fresh()->status)->toBe(BrokerSlipStatus::ChangesRequested->value);
});

test('request-changes requires a changes field via API', function () {
    $slip = makeBrokerSlip($this->tenant, $this->placement, $this->user, [
        'status' => BrokerSlipStatus::PendingReview->value,
    ]);
    BrokerSlipApproval::create([
        'tenant_id' => $this->tenant->id,
        'broker_slip_id' => $slip->id,
        'requested_by' => $this->user->id,
        'status' => BrokerSlipApproval::STATUS_PENDING,
    ]);

    $response = $this->postJson("/api/v1/broker-slips/{$slip->id}/request-changes");

    $response->assertStatus(422);
});

// ─── Workflow: Issue ───

test('can issue an approved broker slip via API', function () {
    $slip = makeBrokerSlip($this->tenant, $this->placement, $this->user, [
        'status' => BrokerSlipStatus::Approved->value,
    ]);

    $response = $this->postJson("/api/v1/broker-slips/{$slip->id}/issue");

    $response->assertOk();
    expect($slip->fresh()->status)->toBe(BrokerSlipStatus::Issued->value);
    expect($slip->fresh()->issued_at)->not->toBeNull();
});

test('cannot issue a draft broker slip via API', function () {
    $slip = makeBrokerSlip($this->tenant, $this->placement, $this->user);

    $response = $this->postJson("/api/v1/broker-slips/{$slip->id}/issue");

    $response->assertStatus(422);
});

// ─── Workflow: Withdraw ───

test('can withdraw an issued broker slip via API', function () {
    $slip = makeBrokerSlip($this->tenant, $this->placement, $this->user, [
        'status' => BrokerSlipStatus::Issued->value,
    ]);

    $response = $this->postJson("/api/v1/broker-slips/{$slip->id}/withdraw");

    $response->assertOk();
    expect($slip->fresh()->status)->toBe(BrokerSlipStatus::Withdrawn->value);
});

test('cannot withdraw a draft broker slip via API', function () {
    $slip = makeBrokerSlip($this->tenant, $this->placement, $this->user);

    $response = $this->postJson("/api/v1/broker-slips/{$slip->id}/withdraw");

    $response->assertStatus(422);
});

// ─── Workflow: Create Version ───

test('can create a new version of an issued broker slip via API', function () {
    $slip = makeBrokerSlip($this->tenant, $this->placement, $this->user, [
        'status' => BrokerSlipStatus::Issued->value,
        'version' => 1,
    ]);

    $response = $this->postJson("/api/v1/broker-slips/{$slip->id}/versions");

    $response->assertCreated();
    expect($slip->fresh()->status)->toBe(BrokerSlipStatus::Superseded->value);
});

test('cannot create a version of a draft broker slip via API', function () {
    $slip = makeBrokerSlip($this->tenant, $this->placement, $this->user);

    $response = $this->postJson("/api/v1/broker-slips/{$slip->id}/versions");

    $response->assertStatus(422);
});
