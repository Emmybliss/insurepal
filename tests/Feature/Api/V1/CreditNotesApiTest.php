<?php

use App\Models\CreditNote;
use App\Models\Customer;
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
        'first_name' => 'CN',
        'last_name' => 'Customer',
        'email' => 'cn.customer@test.com',
        'is_active' => true,
    ]);
});

// ─── List ───

test('can list credit notes via API', function () {
    CreditNote::create([
        'note_number' => '000001',
        'sequence_number' => 1,
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'description' => 'Test credit note 1',
        'amount' => 5000,
        'total_amount' => 5000,
        'created_by_id' => $this->user->id,
    ]);
    CreditNote::create([
        'note_number' => '000002',
        'sequence_number' => 2,
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'description' => 'Test credit note 2',
        'amount' => 8000,
        'total_amount' => 8000,
        'created_by_id' => $this->user->id,
    ]);

    $response = $this->getJson('/api/v1/credit-notes');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'note_number', 'status', 'amount', 'total_amount'],
            ],
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            'links',
        ]);
    expect($response->json('meta.total'))->toBe(2);
});

test('can search credit notes via API', function () {
    CreditNote::create([
        'note_number' => '000001',
        'sequence_number' => 1,
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'description' => 'Special credit',
        'amount' => 5000,
        'total_amount' => 5000,
        'created_by_id' => $this->user->id,
    ]);

    $response = $this->getJson('/api/v1/credit-notes?search=Special');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('can filter credit notes by status via API', function () {
    CreditNote::create([
        'note_number' => '000001',
        'sequence_number' => 1,
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'description' => 'Draft credit',
        'amount' => 5000,
        'total_amount' => 5000,
        'status' => 'draft',
        'created_by_id' => $this->user->id,
    ]);
    CreditNote::create([
        'note_number' => '000002',
        'sequence_number' => 2,
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'description' => 'Issued credit',
        'amount' => 8000,
        'total_amount' => 8000,
        'status' => 'issued',
        'created_by_id' => $this->user->id,
    ]);

    $response = $this->getJson('/api/v1/credit-notes?status=draft');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

// ─── Create ───

test('can create a credit note via API', function () {
    $response = $this->postJson('/api/v1/credit-notes', [
        'customer_id' => $this->customer->id,
        'description' => 'Premium refund',
        'amount' => 5000,
        'total_amount' => 5000,
        'due_date' => now()->addDays(30)->toDateString(),
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'note_number', 'status', 'amount', 'total_amount']]);

    expect($response->json('data.status'))->toBe('draft');
});

test('cannot create credit note without required fields via API', function () {
    $response = $this->postJson('/api/v1/credit-notes', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['customer_id', 'description', 'amount', 'total_amount']);
});

// ─── Show ───

test('can show a credit note via API', function () {
    $note = CreditNote::create([
        'note_number' => '000001',
        'sequence_number' => 1,
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'description' => 'Show test',
        'amount' => 5000,
        'total_amount' => 5000,
        'created_by_id' => $this->user->id,
    ]);

    $response = $this->getJson("/api/v1/credit-notes/{$note->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $note->id)
        ->assertJsonPath('data.note_number', $note->note_number);
});

// ─── Update ───

test('can update a credit note via API', function () {
    $note = CreditNote::create([
        'note_number' => '000001',
        'sequence_number' => 1,
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'description' => 'Original description',
        'amount' => 5000,
        'total_amount' => 5000,
        'created_by_id' => $this->user->id,
    ]);

    $response = $this->putJson("/api/v1/credit-notes/{$note->id}", [
        'description' => 'Updated description',
    ]);

    $response->assertOk();
    expect($note->fresh()->description)->toBe('Updated description');
});

test('cannot update issued credit note via API', function () {
    $note = CreditNote::create([
        'note_number' => '000001',
        'sequence_number' => 1,
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'description' => 'Issued credit',
        'amount' => 5000,
        'total_amount' => 5000,
        'status' => 'issued',
        'created_by_id' => $this->user->id,
    ]);

    $response = $this->putJson("/api/v1/credit-notes/{$note->id}", [
        'description' => 'Should not update',
    ]);

    $response->assertStatus(422);
});

// ─── Delete ───

test('can delete a draft credit note via API', function () {
    $note = CreditNote::create([
        'note_number' => '000001',
        'sequence_number' => 1,
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'description' => 'To delete',
        'amount' => 5000,
        'total_amount' => 5000,
        'created_by_id' => $this->user->id,
    ]);

    $response = $this->deleteJson("/api/v1/credit-notes/{$note->id}");

    $response->assertOk();
    expect(CreditNote::find($note->id))->toBeNull();
    expect(CreditNote::withTrashed()->find($note->id))->not->toBeNull();
});

test('cannot delete issued credit note via API', function () {
    $note = CreditNote::create([
        'note_number' => '000001',
        'sequence_number' => 1,
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'description' => 'Issued credit',
        'amount' => 5000,
        'total_amount' => 5000,
        'status' => 'issued',
        'created_by_id' => $this->user->id,
    ]);

    $response = $this->deleteJson("/api/v1/credit-notes/{$note->id}");

    $response->assertStatus(422);
});

// ─── Workflow ───

test('can issue a credit note via API', function () {
    $note = CreditNote::create([
        'note_number' => '000001',
        'sequence_number' => 1,
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'description' => 'To issue',
        'amount' => 5000,
        'total_amount' => 5000,
        'created_by_id' => $this->user->id,
    ]);

    $response = $this->postJson("/api/v1/credit-notes/{$note->id}/issue");

    $response->assertOk();
    expect($note->fresh()->status)->toBe('issued');
    expect($note->fresh()->issue_date)->not->toBeNull();
});

test('can mark credit note as paid via API', function () {
    $note = CreditNote::create([
        'note_number' => '000001',
        'sequence_number' => 1,
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'description' => 'To pay',
        'amount' => 5000,
        'total_amount' => 5000,
        'status' => 'issued',
        'issue_date' => now(),
        'created_by_id' => $this->user->id,
    ]);

    $response = $this->postJson("/api/v1/credit-notes/{$note->id}/mark-as-paid");

    $response->assertOk();
    expect($note->fresh()->status)->toBe('paid');
});

test('can cancel a credit note via API', function () {
    $note = CreditNote::create([
        'note_number' => '000001',
        'sequence_number' => 1,
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'description' => 'To cancel',
        'amount' => 5000,
        'total_amount' => 5000,
        'status' => 'draft',
        'created_by_id' => $this->user->id,
    ]);

    $response = $this->postJson("/api/v1/credit-notes/{$note->id}/cancel", [
        'reason' => 'No longer needed',
    ]);

    $response->assertOk();
    expect($note->fresh()->status)->toBe('cancelled');
});

test('workflow enforces valid credit note transitions via API', function () {
    $note = CreditNote::create([
        'note_number' => '000001',
        'sequence_number' => 1,
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'description' => 'Workflow test',
        'amount' => 5000,
        'total_amount' => 5000,
        'created_by_id' => $this->user->id,
    ]);

    // Can't mark as paid when draft
    $response = $this->postJson("/api/v1/credit-notes/{$note->id}/mark-as-paid");
    $response->assertStatus(422);

    // Can issue when draft
    $response = $this->postJson("/api/v1/credit-notes/{$note->id}/issue");
    $response->assertOk();

    // Mark as paid
    $response = $this->postJson("/api/v1/credit-notes/{$note->id}/mark-as-paid");
    $response->assertOk();

    // Can't cancel when paid
    $response = $this->postJson("/api/v1/credit-notes/{$note->id}/cancel");
    $response->assertStatus(422);
});
