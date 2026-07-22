<?php

use App\Models\Customer;
use App\Models\Tenant;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    // Seed necessary roles
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

    // Create a Sanctum token for API auth
    $this->token = $this->user->createToken('test-token')->plainTextToken;
    $this->withHeaders(['Authorization' => 'Bearer '.$this->token]);
});

// ─── List customers ───

test('can list customers via API', function () {
    Customer::create([
        'tenant_id' => $this->tenant->id,
        'type' => 'individual',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'email' => 'john@test.com',
        'is_active' => true,
    ]);

    $response = $this->getJson('/api/v1/customers');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'type', 'first_name', 'last_name', 'display_name', 'email', 'is_active', 'has_login_access'],
            ],
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            'links',
        ]);
});

test('can filter customers by search via API', function () {
    Customer::create(['tenant_id' => $this->tenant->id, 'type' => 'individual', 'first_name' => 'Alice', 'last_name' => 'Smith', 'email' => 'alice@test.com', 'is_active' => true]);
    Customer::create(['tenant_id' => $this->tenant->id, 'type' => 'individual', 'first_name' => 'Bob', 'last_name' => 'Jones', 'email' => 'bob@test.com', 'is_active' => true]);

    $response = $this->getJson('/api/v1/customers?search=Alice');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1)
        ->and($response->json('data.0.first_name'))->toBe('Alice');
});

test('can filter customers by type via API', function () {
    Customer::create(['tenant_id' => $this->tenant->id, 'type' => 'individual', 'first_name' => 'Indi', 'last_name' => 'Vidual', 'email' => 'indi@test.com', 'is_active' => true]);
    Customer::create(['tenant_id' => $this->tenant->id, 'type' => 'corporate', 'company_name' => 'Corp Ltd', 'email' => 'corp@test.com', 'is_active' => true]);

    $response = $this->getJson('/api/v1/customers?type=corporate');

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1)
        ->and($response->json('data.0.type'))->toBe('corporate');
});

test('list customers respects tenant isolation via API', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    Customer::create(['tenant_id' => $this->tenant->id, 'type' => 'individual', 'first_name' => 'Mine', 'last_name' => 'Only', 'email' => 'mine@test.com', 'is_active' => true]);
    Customer::create(['tenant_id' => $otherTenant->id, 'type' => 'individual', 'first_name' => 'Other', 'last_name' => 'Tenant', 'email' => 'other@test.com', 'is_active' => true]);

    $response = $this->getJson('/api/v1/customers');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

// ─── Create customer ───

test('can create an individual customer via API', function () {
    $response = $this->postJson('/api/v1/customers', [
        'type' => 'individual',
        'first_name' => 'Jane',
        'last_name' => 'Doe',
        'email' => 'jane@test.com',
        'phone' => '08012345678',
        'is_active' => true,
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'type', 'first_name', 'last_name', 'email']]);

    expect(Customer::where('email', 'jane@test.com')->exists())->toBeTrue();
});

test('can create a corporate customer via API', function () {
    $response = $this->postJson('/api/v1/customers', [
        'type' => 'corporate',
        'company_name' => 'Acme Corp',
        'email' => 'acme@test.com',
        'is_active' => true,
    ]);

    $response->assertCreated();
    expect($response->json('data.type'))->toBe('corporate');
});

test('cannot create customer without required fields via API', function () {
    $response = $this->postJson('/api/v1/customers', [
        'type' => 'individual',
        'first_name' => '',
        'last_name' => '',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['first_name', 'last_name']);
});

test('corporate customer requires company_name via API', function () {
    $response = $this->postJson('/api/v1/customers', [
        'type' => 'corporate',
        'company_name' => '',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['company_name']);
});

test('email must be unique within tenant via API', function () {
    Customer::create(['tenant_id' => $this->tenant->id, 'type' => 'individual', 'first_name' => 'Existing', 'last_name' => 'User', 'email' => 'dup@test.com', 'is_active' => true]);

    $response = $this->postJson('/api/v1/customers', [
        'type' => 'individual',
        'first_name' => 'Second',
        'last_name' => 'User',
        'email' => 'dup@test.com',
        'is_active' => true,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

// ─── Show customer ───

test('can show a customer via API', function () {
    $customer = Customer::create([
        'tenant_id' => $this->tenant->id,
        'type' => 'individual',
        'first_name' => 'Show',
        'last_name' => 'Me',
        'email' => 'show@test.com',
        'is_active' => true,
    ]);

    $response = $this->getJson("/api/v1/customers/{$customer->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $customer->id)
        ->assertJsonPath('data.first_name', 'Show');
});

test('cannot show customer from another tenant via API', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    // Create a customer manually so it bypasses the auto-tenant-scoping in the test
    $customer = Customer::withoutTenantScope()->create(['tenant_id' => $otherTenant->id, 'type' => 'individual', 'first_name' => 'Hidden', 'last_name' => 'User', 'email' => 'hidden@test.com', 'is_active' => true]);

    $response = $this->getJson("/api/v1/customers/{$customer->id}");

    // The TenantScope global scope hides it — returns 404 because the customer is not visible to this tenant
    $response->assertNotFound();
});

// ─── Update customer ───

test('can update a customer via API', function () {
    $customer = Customer::create([
        'tenant_id' => $this->tenant->id,
        'type' => 'individual',
        'first_name' => 'Old',
        'last_name' => 'Name',
        'email' => 'old@test.com',
        'is_active' => true,
    ]);

    $response = $this->putJson("/api/v1/customers/{$customer->id}", [
        'first_name' => 'New',
        'last_name' => 'Name',
        'is_active' => true,
    ]);

    $response->assertOk();
    expect($customer->fresh()->first_name)->toBe('New');
});

// ─── Delete customer ───

test('can delete a customer via API', function () {
    $customer = Customer::create([
        'tenant_id' => $this->tenant->id,
        'type' => 'individual',
        'first_name' => 'Delete',
        'last_name' => 'Me',
        'email' => 'delete@test.com',
        'is_active' => true,
    ]);

    $response = $this->deleteJson("/api/v1/customers/{$customer->id}");

    $response->assertOk();
    expect(Customer::find($customer->id))->toBeNull();
});

// ─── Provision / Revoke access ───

test('can provision login access via API', function () {
    $customer = Customer::create([
        'tenant_id' => $this->tenant->id,
        'type' => 'individual',
        'first_name' => 'Access',
        'last_name' => 'Test',
        'email' => 'access@test.com',
        'is_active' => true,
    ]);

    $response = $this->postJson("/api/v1/customers/{$customer->id}/provision-access", [
        'send_email' => false,
    ]);

    $response->assertOk();
    expect($customer->fresh()->hasLoginAccess())->toBeTrue();
});

test('can revoke login access via API', function () {
    $customer = Customer::create([
        'tenant_id' => $this->tenant->id,
        'type' => 'individual',
        'first_name' => 'Revoke',
        'last_name' => 'Test',
        'email' => 'revoke@test.com',
        'is_active' => true,
    ]);

    $this->postJson("/api/v1/customers/{$customer->id}/provision-access", ['send_email' => false]);
    expect($customer->fresh()->hasLoginAccess())->toBeTrue();

    $response = $this->postJson("/api/v1/customers/{$customer->id}/revoke-access");

    $response->assertOk();
    expect($customer->fresh()->hasLoginAccess())->toBeFalse();
});
