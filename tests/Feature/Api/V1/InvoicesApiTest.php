<?php

use App\Models\Customer;
use App\Models\Invoice;
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
        'first_name' => 'Invoice',
        'last_name' => 'Customer',
        'email' => 'invoice.customer@test.com',
        'is_active' => true,
    ]);
});

function makeInvoice(Tenant $tenant, User $user, Customer $customer, array $overrides = []): Invoice
{
    return Invoice::create(array_merge([
        'tenant_id' => $tenant->id,
        'customer_id' => $customer->id,
        'user_id' => $user->id,
        'invoice_number' => 'INV-'.fake()->unique()->numerify('########'),
        'status' => Invoice::STATUS_DRAFT,
        'currency' => 'USD',
        'subtotal' => 1000.00,
        'tax_amount' => 0,
        'discount_amount' => 0,
        'total_amount' => 1000.00,
        'due_date' => now()->addDays(30),
    ], $overrides));
}

function validInvoicePayload(Customer $customer): array
{
    return [
        'customer_id' => $customer->id,
        'due_date' => now()->addDays(30)->toDateString(),
        'currency' => 'USD',
        'notes' => 'Test invoice notes.',
        'billing_address' => [
            'street' => '123 Main St',
            'city' => 'Lagos',
            'state' => 'Lagos',
            'country' => 'NG',
        ],
        'items' => [
            [
                'description' => 'Consulting Services',
                'quantity' => 10,
                'unit_price' => 100.00,
                'tax_rate' => 7.5,
            ],
            [
                'description' => 'Processing Fee',
                'quantity' => 1,
                'unit_price' => 50.00,
                'discount_rate' => 10,
            ],
        ],
    ];
}

// ─── List ───

test('can list invoices via API', function () {
    makeInvoice($this->tenant, $this->user, $this->customer);

    $response = $this->getJson('/api/v1/invoices');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'invoice_number', 'status', 'total_amount', 'due_date'],
            ],
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            'links',
        ]);
});

test('can search invoices via API', function () {
    makeInvoice($this->tenant, $this->user, $this->customer, [
        'invoice_number' => 'INV-SEARCH-001',
    ]);

    $response = $this->getJson('/api/v1/invoices?search=SEARCH');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('can filter invoices by status via API', function () {
    makeInvoice($this->tenant, $this->user, $this->customer);

    $response = $this->getJson('/api/v1/invoices?status=draft');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('can filter invoices by customer_id via API', function () {
    makeInvoice($this->tenant, $this->user, $this->customer);

    $response = $this->getJson('/api/v1/invoices?customer_id='.$this->customer->id);

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('list invoices respects tenant isolation via API', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    $otherCustomer = Customer::create(['tenant_id' => $otherTenant->id, 'type' => 'individual', 'first_name' => 'Other', 'last_name' => 'Cust', 'email' => 'other.c@test.com', 'is_active' => true]);

    makeInvoice($this->tenant, $this->user, $this->customer);

    Invoice::withoutTenantScope()->create([
        'tenant_id' => $otherTenant->id,
        'customer_id' => $otherCustomer->id,
        'user_id' => $this->user->id,
        'invoice_number' => 'INV-OTHER-001',
        'status' => Invoice::STATUS_DRAFT,
        'currency' => 'USD',
        'subtotal' => 500.00,
        'total_amount' => 500.00,
        'due_date' => now()->addDays(15),
    ]);

    $response = $this->getJson('/api/v1/invoices');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

// ─── Create ───

test('can create an invoice via API', function () {
    $response = $this->postJson('/api/v1/invoices', validInvoicePayload($this->customer));

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'invoice_number', 'status', 'total_amount', 'items']]);

    expect($response->json('data.status'))->toBe('draft');
    expect((float) $response->json('data.total_amount'))->toBe(1120.00);
    expect($response->json('data.items.data'))->toHaveCount(2);
});

test('cannot create invoice without required fields via API', function () {
    $response = $this->postJson('/api/v1/invoices', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['customer_id', 'due_date', 'items']);
});

test('cannot create invoice with empty items via API', function () {
    $response = $this->postJson('/api/v1/invoices', [
        'customer_id' => $this->customer->id,
        'due_date' => now()->addDays(30)->toDateString(),
        'items' => [],
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['items']);
});

// ─── Show ───

test('can show an invoice via API', function () {
    $invoice = makeInvoice($this->tenant, $this->user, $this->customer);

    $response = $this->getJson("/api/v1/invoices/{$invoice->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $invoice->id)
        ->assertJsonPath('data.invoice_number', $invoice->invoice_number);
});

test('cannot show invoice from another tenant via API', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    $otherCustomer = Customer::create(['tenant_id' => $otherTenant->id, 'type' => 'individual', 'first_name' => 'Other', 'last_name' => 'Cust', 'email' => 'other.c@test.com', 'is_active' => true]);

    $invoice = Invoice::withoutTenantScope()->create([
        'tenant_id' => $otherTenant->id,
        'customer_id' => $otherCustomer->id,
        'user_id' => $this->user->id,
        'invoice_number' => 'INV-FORBIDDEN',
        'status' => Invoice::STATUS_DRAFT,
        'currency' => 'USD',
        'subtotal' => 500.00,
        'total_amount' => 500.00,
        'due_date' => now()->addDays(15),
    ]);

    $response = $this->getJson("/api/v1/invoices/{$invoice->id}");

    $response->assertNotFound();
});

// ─── Update ───

test('can update a draft invoice via API', function () {
    $invoice = makeInvoice($this->tenant, $this->user, $this->customer);

    $response = $this->putJson("/api/v1/invoices/{$invoice->id}", [
        'notes' => 'Updated invoice notes.',
    ]);

    $response->assertOk();
    expect($invoice->fresh()->notes)->toBe('Updated invoice notes.');
});

test('can update invoice items via API', function () {
    $invoice = makeInvoice($this->tenant, $this->user, $this->customer);
    $item = $invoice->items()->create([
        'description' => 'Original Item',
        'quantity' => 1,
        'unit_price' => 100.00,
        'total' => 100.00,
    ]);

    $response = $this->putJson("/api/v1/invoices/{$invoice->id}", [
        'items' => [
            [
                'id' => $item->id,
                'description' => 'Updated Item',
                'quantity' => 2,
                'unit_price' => 75.00,
            ],
            [
                'description' => 'New Item',
                'quantity' => 3,
                'unit_price' => 50.00,
            ],
        ],
    ]);

    $response->assertOk();
    expect($invoice->fresh()->items)->toHaveCount(2);
    expect($invoice->fresh()->items->first()->description)->toBe('Updated Item');
});

test('cannot update a sent invoice via API', function () {
    $invoice = makeInvoice($this->tenant, $this->user, $this->customer, [
        'status' => Invoice::STATUS_SENT,
    ]);

    $response = $this->putJson("/api/v1/invoices/{$invoice->id}", [
        'notes' => 'Should not update.',
    ]);

    $response->assertStatus(422);
});

// ─── Delete ───

test('can delete a draft invoice via API', function () {
    $invoice = makeInvoice($this->tenant, $this->user, $this->customer);

    $response = $this->deleteJson("/api/v1/invoices/{$invoice->id}");

    $response->assertOk();
    expect(Invoice::find($invoice->id))->toBeNull();
});

test('cannot delete a sent invoice via API', function () {
    $invoice = makeInvoice($this->tenant, $this->user, $this->customer, [
        'status' => Invoice::STATUS_SENT,
    ]);

    $response = $this->deleteJson("/api/v1/invoices/{$invoice->id}");

    $response->assertStatus(422);
});

// ─── Items ───

test('can list invoice items via API', function () {
    $invoice = makeInvoice($this->tenant, $this->user, $this->customer);
    $invoice->items()->create([
        'description' => 'Test Item',
        'quantity' => 5,
        'unit_price' => 200.00,
        'total' => 1000.00,
    ]);

    $response = $this->getJson("/api/v1/invoices/{$invoice->id}/items");

    $response->assertOk();
    expect($response->json('data.data'))->toHaveCount(1);
    expect($response->json('data.data.0.description'))->toBe('Test Item');
});

// ─── Workflow: Mark as Sent ───

test('can mark a draft invoice as sent via API', function () {
    $invoice = makeInvoice($this->tenant, $this->user, $this->customer);

    $response = $this->postJson("/api/v1/invoices/{$invoice->id}/mark-as-sent");

    $response->assertOk();
    expect($invoice->fresh()->status)->toBe(Invoice::STATUS_SENT);
});

test('cannot mark a paid invoice as sent via API', function () {
    $invoice = makeInvoice($this->tenant, $this->user, $this->customer, [
        'status' => Invoice::STATUS_PAID,
    ]);

    $response = $this->postJson("/api/v1/invoices/{$invoice->id}/mark-as-sent");

    $response->assertStatus(422);
});

// ─── Workflow: Mark as Paid ───

test('can mark a sent invoice as paid via API', function () {
    $invoice = makeInvoice($this->tenant, $this->user, $this->customer, [
        'status' => Invoice::STATUS_SENT,
    ]);

    $response = $this->postJson("/api/v1/invoices/{$invoice->id}/mark-as-paid");

    $response->assertOk();
    expect($invoice->fresh()->status)->toBe(Invoice::STATUS_PAID);
});

test('cannot mark a draft invoice as paid via API', function () {
    $invoice = makeInvoice($this->tenant, $this->user, $this->customer);

    $response = $this->postJson("/api/v1/invoices/{$invoice->id}/mark-as-paid");

    $response->assertStatus(422);
});

// ─── Workflow: Void ───

test('can void a sent invoice via API', function () {
    $invoice = makeInvoice($this->tenant, $this->user, $this->customer, [
        'status' => Invoice::STATUS_SENT,
    ]);

    $response = $this->postJson("/api/v1/invoices/{$invoice->id}/void", [
        'reason' => 'Invoice issued in error.',
    ]);

    $response->assertOk();
    expect($invoice->fresh()->status)->toBe(Invoice::STATUS_VOID);
});

test('cannot void an already voided invoice via API', function () {
    $invoice = makeInvoice($this->tenant, $this->user, $this->customer, [
        'status' => Invoice::STATUS_VOID,
    ]);

    $response = $this->postJson("/api/v1/invoices/{$invoice->id}/void");

    $response->assertStatus(422);
});

// ─── Workflow: Cancel ───

test('can cancel a sent invoice via API', function () {
    $invoice = makeInvoice($this->tenant, $this->user, $this->customer, [
        'status' => Invoice::STATUS_SENT,
    ]);

    $response = $this->postJson("/api/v1/invoices/{$invoice->id}/cancel", [
        'reason' => 'Customer requested cancellation.',
    ]);

    $response->assertOk();
    expect($invoice->fresh()->status)->toBe(Invoice::STATUS_CANCELLED);
});

test('cannot cancel a paid invoice via API', function () {
    $invoice = makeInvoice($this->tenant, $this->user, $this->customer, [
        'status' => Invoice::STATUS_PAID,
    ]);

    $response = $this->postJson("/api/v1/invoices/{$invoice->id}/cancel");

    $response->assertStatus(422);
});

// ─── Invoice creation calculates totals correctly ───

test('invoice totals are calculated correctly from items via API', function () {
    $response = $this->postJson('/api/v1/invoices', [
        'customer_id' => $this->customer->id,
        'due_date' => now()->addDays(30)->toDateString(),
        'items' => [
            ['description' => 'Item A', 'quantity' => 2, 'unit_price' => 100.00, 'tax_rate' => 10],
            ['description' => 'Item B', 'quantity' => 1, 'unit_price' => 50.00],
        ],
    ]);

    $response->assertCreated();
    // Item A: qty 2 * 100 = 200, tax 10% = 20, total = 220
    // Item B: qty 1 * 50 = 50, total = 50
    // subtotal = 250, tax = 20, total = 270
    expect((float) $response->json('data.subtotal'))->toBe(270.00);
    expect((float) $response->json('data.tax_amount'))->toBe(20.00);
    expect((float) $response->json('data.total_amount'))->toBe(270.00);
    expect($response->json('data.items.data'))->toHaveCount(2);
});
