<?php

use App\Enums\PlacementStatus;
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
        'first_name' => 'Placement',
        'last_name' => 'Customer',
        'email' => 'placement.customer@test.com',
        'is_active' => true,
    ]);

    $this->policyType = PolicyType::create([
        'name' => 'General Insurance',
        'code' => 'GEN_PL',
        'description' => 'General insurance for placement tests',
        'is_active' => true,
        'form_fields' => [],
        'base_premium' => 10000,
        'commission_rate' => 10,
        'sort_order' => 1,
    ]);

    $this->policyClass = PolicyClass::create([
        'policy_type_id' => $this->policyType->id,
        'name' => 'Standard',
        'code' => 'STD_PL',
        'is_active' => true,
    ]);

    $this->policyProduct = PolicyProduct::create([
        'tenant_id' => $this->tenant->id,
        'policy_type_id' => $this->policyType->id,
        'policy_class_id' => $this->policyClass->id,
        'name' => 'Standard Coverage',
        'code' => 'STD_COV_PL',
        'base_premium' => 5000.00,
        'commission_rate' => 10.00,
        'is_active' => true,
    ]);

    $this->insuranceCompany = InsuranceCompany::create([
        'name' => 'Test Insurer',
        'company_type' => 'underwriter',
        'email' => 'insurer@test.com',
        'is_active' => true,
    ]);
});

function makePlacement(Tenant $tenant, Customer $customer, PolicyProduct $product, User $user, array $overrides = []): Placement
{
    return Placement::create(array_merge([
        'tenant_id' => $tenant->id,
        'customer_id' => $customer->id,
        'policy_product_id' => $product->id,
        'proposed_start_date' => now()->toDateString(),
        'proposed_end_date' => now()->addYear()->toDateString(),
        'total_sum_insured' => 100000.00,
        'status' => PlacementStatus::Draft->value,
        'created_by' => $user->id,
    ], $overrides));
}

function makeMarket(Tenant $tenant, Placement $placement, InsuranceCompany $company, array $overrides = []): PlacementMarket
{
    return PlacementMarket::create(array_merge([
        'tenant_id' => $tenant->id,
        'placement_id' => $placement->id,
        'insurance_company_id' => $company->id,
        'is_lead' => true,
        'status' => 'pending',
    ], $overrides));
}

// ─── List placements ───

test('can list placements via API', function () {
    makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user);

    $response = $this->getJson('/api/v1/placements');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'placement_number', 'status', 'total_sum_insured'],
            ],
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            'links',
        ]);
});

test('can search placements via API', function () {
    makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user);

    $response = $this->getJson('/api/v1/placements?search=Placement');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('can filter placements by status via API', function () {
    makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user);

    $response = $this->getJson('/api/v1/placements?status=draft');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('list placements respects tenant isolation via API', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    $otherCustomer = Customer::create(['tenant_id' => $otherTenant->id, 'type' => 'individual', 'first_name' => 'Other', 'last_name' => 'Cust', 'email' => 'other.c@test.com', 'is_active' => true]);

    makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user);

    Placement::withoutTenantScope()->create([
        'placement_number' => 'PL-OTHER-000001',
        'tenant_id' => $otherTenant->id,
        'customer_id' => $otherCustomer->id,
        'policy_product_id' => $this->policyProduct->id,
        'proposed_start_date' => now()->toDateString(),
        'proposed_end_date' => now()->addYear()->toDateString(),
        'total_sum_insured' => 50000.00,
        'status' => PlacementStatus::Draft->value,
        'created_by' => $this->user->id,
    ]);

    $response = $this->getJson('/api/v1/placements');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

// ─── Create placement ───

test('can create a placement via API', function () {
    $response = $this->postJson('/api/v1/placements', [
        'customer_id' => $this->customer->id,
        'policy_product_id' => $this->policyProduct->id,
        'currency' => 'NGN',
        'proposed_start_date' => now()->toDateString(),
        'proposed_end_date' => now()->addYear()->toDateString(),
        'total_sum_insured' => 200000.00,
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'placement_number', 'status', 'total_sum_insured']]);

    expect($response->json('data.status'))->toBe('draft');
});

test('cannot create placement without required fields via API', function () {
    $response = $this->postJson('/api/v1/placements', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['customer_id', 'policy_product_id', 'proposed_start_date', 'proposed_end_date']);
});

// ─── Show placement ───

test('can show a placement via API', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user);

    $response = $this->getJson("/api/v1/placements/{$placement->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $placement->id)
        ->assertJsonPath('data.placement_number', $placement->placement_number);
});

test('cannot show placement from another tenant via API', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    $otherCustomer = Customer::create(['tenant_id' => $otherTenant->id, 'type' => 'individual', 'first_name' => 'Other', 'last_name' => 'Cust', 'email' => 'other.c@test.com', 'is_active' => true]);

    $placement = Placement::withoutTenantScope()->create([
        'tenant_id' => $otherTenant->id,
        'customer_id' => $otherCustomer->id,
        'policy_product_id' => $this->policyProduct->id,
        'proposed_start_date' => now()->toDateString(),
        'proposed_end_date' => now()->addYear()->toDateString(),
        'total_sum_insured' => 50000.00,
        'status' => PlacementStatus::Draft->value,
        'created_by' => $this->user->id,
    ]);

    $response = $this->getJson("/api/v1/placements/{$placement->id}");

    $response->assertNotFound();
});

// ─── Update placement ───

test('can update a draft placement via API', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user);

    $response = $this->putJson("/api/v1/placements/{$placement->id}", [
        'total_sum_insured' => 300000.00,
        'notes' => 'Updated notes for placement.',
    ]);

    $response->assertOk();
    expect((float) $placement->fresh()->total_sum_insured)->toBe(300000.00);
    expect($placement->fresh()->notes)->toBe('Updated notes for placement.');
});

test('cannot update a non-draft placement via API', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user, [
        'status' => PlacementStatus::InMarket->value,
    ]);

    $response = $this->putJson("/api/v1/placements/{$placement->id}", [
        'total_sum_insured' => 999999.00,
    ]);

    $response->assertStatus(422);
});

// ─── Delete placement ───

test('can delete a draft placement via API', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user);

    $response = $this->deleteJson("/api/v1/placements/{$placement->id}");

    $response->assertOk();
    expect(Placement::find($placement->id))->toBeNull();
});

test('cannot delete a placement via API if it has a policy', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user);
    $placement->policy()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'policy_product_id' => $this->policyProduct->id,
        'policy_type_id' => $this->policyType->id,
        'policy_class_id' => $this->policyClass->id,
        'policy_number' => 'POL-PL-001',
        'source_type' => 'BROKER_RECORDED',
        'status' => 'active',
        'effective_date' => now(),
        'expiry_date' => now()->addYear(),
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'sum_insured' => 100000.00,
        'created_by' => $this->user->id,
    ]);

    $response = $this->deleteJson("/api/v1/placements/{$placement->id}");

    $response->assertStatus(422);
});

// ─── Workflow: Submit to Market ───

test('can submit a draft placement to market via API', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user);
    makeMarket($this->tenant, $placement, $this->insuranceCompany);

    $response = $this->postJson("/api/v1/placements/{$placement->id}/submit-to-market");

    $response->assertOk();
    expect($placement->fresh()->status)->toBe(PlacementStatus::InMarket->value);
});

test('cannot submit to market without markets via API', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user);

    $response = $this->postJson("/api/v1/placements/{$placement->id}/submit-to-market");

    $response->assertStatus(422);
});

test('cannot submit a non-draft placement to market via API', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user, [
        'status' => PlacementStatus::InMarket->value,
    ]);

    $response = $this->postJson("/api/v1/placements/{$placement->id}/submit-to-market");

    $response->assertStatus(422);
});

// ─── Workflow: Bind ───

test('can bind an accepted placement via API', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user, [
        'status' => PlacementStatus::Accepted->value,
    ]);

    $response = $this->postJson("/api/v1/placements/{$placement->id}/bind");

    $response->assertOk();
    expect($placement->fresh()->status)->toBe(PlacementStatus::Bound->value);
});

test('cannot bind a draft placement via API', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user);

    $response = $this->postJson("/api/v1/placements/{$placement->id}/bind");

    $response->assertStatus(422);
});

// ─── Workflow: Cancel ───

test('can cancel a placement via API', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user, [
        'status' => PlacementStatus::InMarket->value,
    ]);

    $response = $this->postJson("/api/v1/placements/{$placement->id}/cancel");

    $response->assertOk();
    expect($placement->fresh()->status)->toBe(PlacementStatus::Cancelled->value);
});

test('cannot cancel an already cancelled placement via API', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user, [
        'status' => PlacementStatus::Cancelled->value,
    ]);

    $response = $this->postJson("/api/v1/placements/{$placement->id}/cancel");

    $response->assertStatus(422);
});

// ─── Workflow: Convert to Policy ───

test('can convert a bound placement to policy via API', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user, [
        'status' => PlacementStatus::Bound->value,
        'risk_details' => [['type' => 'basic', 'amount' => 100000]],
    ]);
    makeMarket($this->tenant, $placement, $this->insuranceCompany, ['status' => 'accepted']);

    $response = $this->postJson("/api/v1/placements/{$placement->id}/convert-to-policy");

    $response->assertOk();
    expect($response->json('data'))->toHaveKeys(['policy_id', 'policy_number']);
});

test('cannot convert a draft placement to policy via API', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user);

    $response = $this->postJson("/api/v1/placements/{$placement->id}/convert-to-policy");

    $response->assertStatus(422);
});

// ─── Markets ───

test('can list markets for a placement via API', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user);
    makeMarket($this->tenant, $placement, $this->insuranceCompany);

    $response = $this->getJson("/api/v1/placements/{$placement->id}/markets");

    $response->assertOk();
    expect(count($response->json('data')))->toBe(1);
});

test('can add a market to a placement via API', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user);

    $response = $this->postJson("/api/v1/placements/{$placement->id}/markets", [
        'insurance_company_id' => $this->insuranceCompany->id,
        'is_lead' => true,
        'participation_percentage' => 100.00,
    ]);

    $response->assertCreated();
    expect($placement->fresh()->markets()->count())->toBe(1);
});

test('can show a market via API', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user);
    $market = makeMarket($this->tenant, $placement, $this->insuranceCompany);

    $response = $this->getJson("/api/v1/placements/{$placement->id}/markets/{$market->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $market->id);
});

test('can update a market via API', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user);
    $market = makeMarket($this->tenant, $placement, $this->insuranceCompany);

    $response = $this->putJson("/api/v1/placements/{$placement->id}/markets/{$market->id}", [
        'participation_percentage' => 75.00,
        'insurer_branch' => 'Lagos Branch',
    ]);

    $response->assertOk();
    expect((float) $market->fresh()->participation_percentage)->toBe(75.00);
    expect($market->fresh()->insurer_branch)->toBe('Lagos Branch');
});

test('can delete a market via API', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user);
    $market = makeMarket($this->tenant, $placement, $this->insuranceCompany);

    $response = $this->deleteJson("/api/v1/placements/{$placement->id}/markets/{$market->id}");

    $response->assertOk();
    expect($placement->fresh()->markets()->count())->toBe(0);
});

test('can respond to a market via API', function () {
    $placement = makePlacement($this->tenant, $this->customer, $this->policyProduct, $this->user);
    $market = makeMarket($this->tenant, $placement, $this->insuranceCompany);

    $response = $this->postJson("/api/v1/placements/{$placement->id}/markets/{$market->id}/respond", [
        'status' => 'accepted',
        'response_notes' => 'Rate agreed at 5.5%',
        'insurer_reference' => 'INS-REF-001',
    ]);

    $response->assertOk();
    expect($market->fresh()->status)->toBe('accepted');
});
