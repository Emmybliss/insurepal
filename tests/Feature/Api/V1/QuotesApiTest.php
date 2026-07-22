<?php

use App\Models\Customer;
use App\Models\InsuranceProduct;
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
        'first_name' => 'Quote',
        'last_name' => 'Customer',
        'email' => 'quote.customer@test.com',
        'is_active' => true,
    ]);

    $this->product = InsuranceProduct::create([
        'name' => 'Test Insurance',
        'slug' => 'test-insurance',
        'type' => 'life',
        'description' => 'Test product description',
        'form_fields' => [],
        'premium_rules' => [],
        'base_premium' => 5000.00,
        'is_active' => true,
    ]);
});

// ─── List quotes ───

test('can list quotes via API', function () {
    Quote::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurance_product_id' => $this->product->id,
        'quote_number' => 'QT2026000001',
        'status' => 'draft',
        'coverage_details' => [['type' => 'basic', 'amount' => 100000, 'description' => 'Basic coverage']],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'valid_until' => now()->addDays(30),
        'form_data' => [],
        'created_by' => $this->user->id,
    ]);

    $response = $this->getJson('/api/v1/quotes');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'quote_number', 'status', 'premium_amount', 'total_amount', 'valid_until', 'customer_name'],
            ],
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            'links',
        ]);
});

test('can filter quotes by search via API', function () {
    Quote::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurance_product_id' => $this->product->id,
        'quote_number' => 'QT2026000001',
        'status' => 'draft',
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'valid_until' => now()->addDays(30),
        'form_data' => [],
        'created_by' => $this->user->id,
    ]);

    $response = $this->getJson('/api/v1/quotes?search=QT2026');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('can filter quotes by status via API', function () {
    Quote::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurance_product_id' => $this->product->id,
        'quote_number' => 'QT2026000001',
        'status' => 'draft',
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'valid_until' => now()->addDays(30),
        'form_data' => [],
        'created_by' => $this->user->id,
    ]);

    $response = $this->getJson('/api/v1/quotes?status=draft');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('list quotes respects tenant isolation via API', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    $otherCustomer = Customer::create(['tenant_id' => $otherTenant->id, 'type' => 'individual', 'first_name' => 'Other', 'last_name' => 'Cust', 'email' => 'other.cust@test.com', 'is_active' => true]);

    Quote::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurance_product_id' => $this->product->id,
        'quote_number' => 'QT2026000001',
        'status' => 'draft',
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'valid_until' => now()->addDays(30),
        'form_data' => [],
        'created_by' => $this->user->id,
    ]);

    Quote::create([
        'tenant_id' => $otherTenant->id,
        'customer_id' => $otherCustomer->id,
        'insurance_product_id' => $this->product->id,
        'quote_number' => 'QT2026000002',
        'status' => 'draft',
        'coverage_details' => [['type' => 'basic', 'amount' => 200000]],
        'premium_amount' => 6000.00,
        'commission_amount' => 600.00,
        'total_amount' => 6600.00,
        'valid_until' => now()->addDays(30),
        'form_data' => [],
        'created_by' => $this->user->id,
    ]);

    $response = $this->getJson('/api/v1/quotes');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

// ─── Create quote ───

test('can create a quote via API', function () {
    $response = $this->postJson('/api/v1/quotes', [
        'customer_id' => $this->customer->id,
        'insurance_product_id' => $this->product->id,
        'coverage_details' => [
            ['type' => 'basic', 'amount' => 100000, 'description' => 'Basic coverage'],
        ],
        'valid_until' => now()->addDays(30)->toDateString(),
        'notes' => 'Test quote notes',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'quote_number', 'status', 'premium_amount', 'total_amount']]);

    expect($response->json('data.status'))->toBe('draft');
});

test('can create a quote with form_data via API', function () {
    $response = $this->postJson('/api/v1/quotes', [
        'customer_id' => $this->customer->id,
        'insurance_product_id' => $this->product->id,
        'coverage_details' => [
            ['type' => 'premium', 'amount' => 50000],
        ],
        'valid_until' => now()->addDays(30)->toDateString(),
        'form_data' => ['age' => 30, 'smoker' => false],
    ]);

    $response->assertCreated();
    expect($response->json('data.status'))->toBe('draft');
});

test('cannot create quote without required fields via API', function () {
    $response = $this->postJson('/api/v1/quotes', [
        'customer_id' => '',
        'insurance_product_id' => '',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['customer_id', 'insurance_product_id', 'coverage_details', 'valid_until']);
});

// ─── Show quote ───

test('can show a quote via API', function () {
    $quote = Quote::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurance_product_id' => $this->product->id,
        'quote_number' => 'QT2026000010',
        'status' => 'draft',
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'valid_until' => now()->addDays(30),
        'form_data' => [],
        'created_by' => $this->user->id,
    ]);

    $response = $this->getJson("/api/v1/quotes/{$quote->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $quote->id)
        ->assertJsonPath('data.quote_number', 'QT2026000010');
});

test('cannot show quote from another tenant via API', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    $otherCustomer = Customer::create(['tenant_id' => $otherTenant->id, 'type' => 'individual', 'first_name' => 'Other', 'last_name' => 'Cust', 'email' => 'other.c@test.com', 'is_active' => true]);

    $quote = Quote::withoutTenantScope()->create([
        'tenant_id' => $otherTenant->id,
        'customer_id' => $otherCustomer->id,
        'insurance_product_id' => $this->product->id,
        'quote_number' => 'QT2026000999',
        'status' => 'draft',
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'valid_until' => now()->addDays(30),
        'form_data' => [],
        'created_by' => $this->user->id,
    ]);

    $response = $this->getJson("/api/v1/quotes/{$quote->id}");

    $response->assertNotFound();
});

// ─── Update quote ───

test('can update a quote via API', function () {
    $quote = Quote::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurance_product_id' => $this->product->id,
        'quote_number' => 'QT2026000020',
        'status' => 'draft',
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'valid_until' => now()->addDays(30),
        'form_data' => [],
        'created_by' => $this->user->id,
    ]);

    $response = $this->putJson("/api/v1/quotes/{$quote->id}", [
        'notes' => 'Updated notes',
    ]);

    $response->assertOk();
    expect($quote->fresh()->notes)->toBe('Updated notes');
});

// ─── Delete quote ───

test('can delete a draft quote via API', function () {
    $quote = Quote::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurance_product_id' => $this->product->id,
        'quote_number' => 'QT2026000030',
        'status' => 'draft',
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'valid_until' => now()->addDays(30),
        'form_data' => [],
        'created_by' => $this->user->id,
    ]);

    $response = $this->deleteJson("/api/v1/quotes/{$quote->id}");

    $response->assertOk();
    expect(Quote::find($quote->id))->toBeNull();
});

// ─── Workflow: Send ───

test('can send a quote via API', function () {
    $quote = Quote::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurance_product_id' => $this->product->id,
        'quote_number' => 'QT2026000040',
        'status' => 'draft',
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'valid_until' => now()->addDays(30),
        'form_data' => [],
        'created_by' => $this->user->id,
    ]);

    $response = $this->postJson("/api/v1/quotes/{$quote->id}/send");

    $response->assertOk();
    expect($quote->fresh()->status)->toBe('sent');
    expect($quote->fresh()->sent_at)->not->toBeNull();
});

test('cannot send a non-draft quote via API', function () {
    $quote = Quote::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurance_product_id' => $this->product->id,
        'quote_number' => 'QT2026000041',
        'status' => 'sent',
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'valid_until' => now()->addDays(30),
        'form_data' => [],
        'created_by' => $this->user->id,
        'sent_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/quotes/{$quote->id}/send");

    $response->assertStatus(422);
});

// ─── Workflow: Accept ───

test('can accept a sent quote via API', function () {
    $quote = Quote::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurance_product_id' => $this->product->id,
        'quote_number' => 'QT2026000050',
        'status' => 'sent',
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'valid_until' => now()->addDays(30),
        'form_data' => [],
        'created_by' => $this->user->id,
        'sent_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/quotes/{$quote->id}/accept", [
        'reason' => 'Customer agreed to terms',
    ]);

    $response->assertOk();
    expect($quote->fresh()->status)->toBe('accepted');
});

// ─── Workflow: Reject ───

test('can reject a sent quote via API', function () {
    $quote = Quote::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurance_product_id' => $this->product->id,
        'quote_number' => 'QT2026000060',
        'status' => 'sent',
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'valid_until' => now()->addDays(30),
        'form_data' => [],
        'created_by' => $this->user->id,
        'sent_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/quotes/{$quote->id}/reject", [
        'reason' => 'Customer found better rate',
    ]);

    $response->assertOk();
    expect($quote->fresh()->status)->toBe('rejected');
});

test('reject requires a reason via API', function () {
    $quote = Quote::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurance_product_id' => $this->product->id,
        'quote_number' => 'QT2026000061',
        'status' => 'sent',
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'valid_until' => now()->addDays(30),
        'form_data' => [],
        'created_by' => $this->user->id,
        'sent_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/quotes/{$quote->id}/reject");

    $response->assertStatus(422);
});

// ─── Workflow: Duplicate ───

test('can duplicate a quote via API', function () {
    $quote = Quote::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurance_product_id' => $this->product->id,
        'quote_number' => 'QT2026000070',
        'status' => 'draft',
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'valid_until' => now()->addDays(30),
        'form_data' => [],
        'created_by' => $this->user->id,
    ]);

    $response = $this->postJson("/api/v1/quotes/{$quote->id}/duplicate");

    $response->assertOk();
    expect($response->json('data.quote_number'))->not->toBe('QT2026000070');
    expect($response->json('data.status'))->toBe('draft');
});

// ─── Workflow: Extend Validity ───

test('can extend quote validity via API', function () {
    $quote = Quote::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurance_product_id' => $this->product->id,
        'quote_number' => 'QT2026000080',
        'status' => 'sent',
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'valid_until' => now()->addDays(30),
        'form_data' => [],
        'created_by' => $this->user->id,
        'sent_at' => now(),
    ]);

    $originalDate = $quote->valid_until->toDateString();

    $response = $this->postJson("/api/v1/quotes/{$quote->id}/extend-validity", [
        'days' => 15,
    ]);

    $response->assertOk();
    $this->assertNotEquals($originalDate, $quote->fresh()->valid_until->toDateString());
});

test('extend validity validates days parameter via API', function () {
    $quote = Quote::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurance_product_id' => $this->product->id,
        'quote_number' => 'QT2026000081',
        'status' => 'draft',
        'coverage_details' => [['type' => 'basic', 'amount' => 100000]],
        'premium_amount' => 5000.00,
        'commission_amount' => 500.00,
        'total_amount' => 5500.00,
        'valid_until' => now()->addDays(30),
        'form_data' => [],
        'created_by' => $this->user->id,
    ]);

    $response = $this->postJson("/api/v1/quotes/{$quote->id}/extend-validity");

    $response->assertStatus(422);

    $response2 = $this->postJson("/api/v1/quotes/{$quote->id}/extend-validity", [
        'days' => 500,
    ]);

    $response2->assertStatus(422);
});
