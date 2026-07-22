<?php

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Receipt;
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
        'first_name' => 'Receipt',
        'last_name' => 'Customer',
        'email' => 'receipt.customer@test.com',
        'is_active' => true,
    ]);

    $this->invoice = Invoice::create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'invoice_number' => 'INV-'.fake()->unique()->numerify('########'),
        'total_amount' => 50000,
        'subtotal' => 50000,
        'status' => 'draft',
        'due_date' => now()->addDays(30),
    ]);
});

// ─── List ───

test('can list receipts via API', function () {
    Receipt::factory()->count(3)->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'invoice_id' => $this->invoice->id,
    ]);

    $response = $this->getJson('/api/v1/receipts');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'receipt_number', 'payment_status', 'amount_paid'],
            ],
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            'links',
        ]);
    expect($response->json('meta.total'))->toBe(3);
});

test('can search receipts via API', function () {
    Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'invoice_id' => $this->invoice->id,
        'receipt_number' => 'RCP-2026-00000001',
    ]);
    Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'invoice_id' => $this->invoice->id,
        'receipt_number' => 'RCP-2026-00000002',
    ]);

    $response = $this->getJson('/api/v1/receipts?search=00000001');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('can filter receipts by payment_status via API', function () {
    Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'invoice_id' => $this->invoice->id,
        'payment_status' => 'completed',
    ]);
    Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'invoice_id' => $this->invoice->id,
        'payment_status' => 'pending',
    ]);

    $response = $this->getJson('/api/v1/receipts?payment_status=completed');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

// ─── Create ───

test('can create a receipt via API', function () {
    $response = $this->postJson('/api/v1/receipts', [
        'invoice_id' => $this->invoice->id,
        'customer_id' => $this->customer->id,
        'amount_paid' => 25000,
        'payment_method' => 'bank_transfer',
        'payment_date' => now()->toDateString(),
        'currency' => 'USD',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'receipt_number', 'payment_status', 'amount_paid']]);

    expect($response->json('data.amount_paid'))->toEqual(25000.0);
});

test('cannot create receipt without required fields via API', function () {
    $response = $this->postJson('/api/v1/receipts', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['invoice_id', 'customer_id', 'amount_paid', 'payment_method', 'payment_date']);
});

// ─── Show ───

test('can show a receipt via API', function () {
    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'invoice_id' => $this->invoice->id,
    ]);

    $response = $this->getJson("/api/v1/receipts/{$receipt->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $receipt->id)
        ->assertJsonPath('data.receipt_number', $receipt->receipt_number);
});

test('show includes relations when loaded via API', function () {
    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'invoice_id' => $this->invoice->id,
    ]);

    $response = $this->getJson("/api/v1/receipts/{$receipt->id}");

    $response->assertOk();
    expect($response->json('data.customer'))->not->toBeNull();
    expect($response->json('data.invoice'))->not->toBeNull();
});

// ─── Update ───

test('can update a receipt via API', function () {
    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'invoice_id' => $this->invoice->id,
        'payment_status' => 'pending',
    ]);

    $response = $this->putJson("/api/v1/receipts/{$receipt->id}", [
        'notes' => 'Updated notes.',
    ]);

    $response->assertOk();
    expect($receipt->fresh()->notes)->toBe('Updated notes.');
});

test('cannot update completed receipt via API', function () {
    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'invoice_id' => $this->invoice->id,
        'payment_status' => 'completed',
    ]);

    $response = $this->putJson("/api/v1/receipts/{$receipt->id}", [
        'notes' => 'Should not update',
    ]);

    $response->assertStatus(422);
});

// ─── Delete ───

test('can delete a pending receipt via API', function () {
    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'invoice_id' => $this->invoice->id,
        'payment_status' => 'pending',
    ]);

    $response = $this->deleteJson("/api/v1/receipts/{$receipt->id}");

    $response->assertOk();
    expect(Receipt::find($receipt->id))->toBeNull();
    expect(Receipt::withTrashed()->find($receipt->id))->not->toBeNull();
});

test('cannot delete completed receipt via API', function () {
    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'invoice_id' => $this->invoice->id,
        'payment_status' => 'completed',
    ]);

    $response = $this->deleteJson("/api/v1/receipts/{$receipt->id}");

    $response->assertStatus(422);
});

// ─── Workflow ───

test('can mark receipt as completed via API', function () {
    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'invoice_id' => $this->invoice->id,
        'payment_status' => 'pending',
    ]);

    $response = $this->postJson("/api/v1/receipts/{$receipt->id}/mark-as-completed");

    $response->assertOk();
    expect($receipt->fresh()->payment_status)->toBe('completed');
});

test('can mark receipt as refunded via API', function () {
    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'invoice_id' => $this->invoice->id,
        'payment_status' => 'completed',
    ]);

    $response = $this->postJson("/api/v1/receipts/{$receipt->id}/mark-as-refunded");

    $response->assertOk();
    expect($receipt->fresh()->payment_status)->toBe('refunded');
});

test('can void a receipt via API', function () {
    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'invoice_id' => $this->invoice->id,
        'payment_status' => 'pending',
    ]);

    $response = $this->postJson("/api/v1/receipts/{$receipt->id}/void", [
        'reason' => 'Payment error',
    ]);

    $response->assertOk();
    expect($receipt->fresh()->payment_status)->toBe('voided');
});

test('workflow enforces valid status transitions via API', function () {
    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'invoice_id' => $this->invoice->id,
        'payment_status' => 'pending',
    ]);

    // Can't refund a pending receipt
    $response = $this->postJson("/api/v1/receipts/{$receipt->id}/mark-as-refunded");
    $response->assertStatus(422);

    // Can void from pending
    $response = $this->postJson("/api/v1/receipts/{$receipt->id}/void");
    $response->assertOk();

    // Can't void twice
    $response = $this->postJson("/api/v1/receipts/{$receipt->id}/void");
    $response->assertStatus(422);
});

// ─── Allocations ───

test('can list allocations via API', function () {
    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'invoice_id' => $this->invoice->id,
    ]);
    $receipt->receiptAllocations()->create([
        'tenant_id' => $this->tenant->id,
        'allocation_type' => \App\Enums\AllocationType::Premium,
        'amount' => 25000,
    ]);
    $receipt->receiptAllocations()->create([
        'tenant_id' => $this->tenant->id,
        'allocation_type' => \App\Enums\AllocationType::Commission,
        'amount' => 5000,
    ]);

    $response = $this->getJson("/api/v1/receipts/{$receipt->id}/allocations");

    $response->assertOk();
    expect($response->json('data.data'))->toHaveCount(2);
});
