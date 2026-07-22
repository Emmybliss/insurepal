<?php

use App\Models\SupportTicket;
use App\Models\Tenant;
use App\Models\User;

beforeEach(function () {
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
});

// ─── List ───

test('can list support tickets via API', function () {
    SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'Cannot login',
        'description' => 'I am unable to access my account.',
        'priority' => 'high',
        'category' => 'technical',
        'status' => 'new',
    ]);
    SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'Invoice question',
        'description' => 'I have a question about my invoice.',
        'priority' => 'medium',
        'category' => 'billing',
        'status' => 'open',
    ]);

    $response = $this->getJson('/api/v1/support-tickets');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'ticket_number', 'subject', 'status', 'priority', 'category'],
            ],
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            'links',
        ]);
    expect($response->json('meta.total'))->toBe(2);
});

test('can search support tickets via API', function () {
    SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'Urgent billing issue',
        'description' => 'Need help with payment.',
        'priority' => 'urgent',
        'category' => 'billing',
        'status' => 'new',
    ]);

    $response = $this->getJson('/api/v1/support-tickets?search=billing');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('can filter support tickets by status via API', function () {
    SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'Open issue',
        'description' => 'Description',
        'priority' => 'low',
        'category' => 'general',
        'status' => 'open',
    ]);
    SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'Resolved issue',
        'description' => 'Description',
        'priority' => 'low',
        'category' => 'general',
        'status' => 'resolved',
    ]);

    $response = $this->getJson('/api/v1/support-tickets?status=open');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('list support tickets respects tenant isolation via API', function () {
    SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'My ticket',
        'description' => 'Description',
        'priority' => 'medium',
        'category' => 'general',
        'status' => 'new',
    ]);

    $otherTenant = Tenant::create([
        'name' => 'Other Broker',
        'type' => 'broker',
        'status' => 'active',
        'onboarding_completed' => true,
        'email' => 'other@test.com',
    ]);
    SupportTicket::create([
        'tenant_id' => $otherTenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'Other ticket',
        'description' => 'Description',
        'priority' => 'medium',
        'category' => 'general',
        'status' => 'new',
    ]);

    $response = $this->getJson('/api/v1/support-tickets');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

// ─── Create ───

test('can create a support ticket via API', function () {
    $response = $this->postJson('/api/v1/support-tickets', [
        'subject' => 'Cannot access portal',
        'description' => 'I am unable to login to the customer portal.',
        'priority' => 'high',
        'category' => 'technical',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'ticket_number', 'subject', 'status', 'priority', 'category']]);

    expect($response->json('data.status'))->toBe('new');
    expect($response->json('data.requester.id'))->toBe($this->user->id);
});

test('cannot create support ticket without required fields via API', function () {
    $response = $this->postJson('/api/v1/support-tickets', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['subject', 'description', 'priority', 'category']);
});

// ─── Show ───

test('can show a support ticket via API', function () {
    $ticket = SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'Show test',
        'description' => 'Show description',
        'priority' => 'medium',
        'category' => 'general',
        'status' => 'new',
    ]);

    $response = $this->getJson("/api/v1/support-tickets/{$ticket->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $ticket->id)
        ->assertJsonPath('data.subject', $ticket->subject);
});

test('cannot show support ticket from another tenant via API', function () {
    $otherTenant = Tenant::create([
        'name' => 'Other Broker',
        'type' => 'broker',
        'status' => 'active',
        'onboarding_completed' => true,
        'email' => 'other@test.com',
    ]);
    $ticket = SupportTicket::withoutTenantScope()->create([
        'tenant_id' => $otherTenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'Other ticket',
        'description' => 'Description',
        'priority' => 'medium',
        'category' => 'general',
        'status' => 'new',
    ]);

    $response = $this->getJson("/api/v1/support-tickets/{$ticket->id}");

    $response->assertNotFound();
});

// ─── Update ───

test('can update a support ticket via API', function () {
    $ticket = SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'Original subject',
        'description' => 'Original description',
        'priority' => 'low',
        'category' => 'general',
        'status' => 'new',
    ]);

    $response = $this->putJson("/api/v1/support-tickets/{$ticket->id}", [
        'subject' => 'Updated subject',
        'priority' => 'high',
    ]);

    $response->assertOk();
    expect($ticket->fresh()->subject)->toBe('Updated subject');
    expect($ticket->fresh()->priority)->toBe('high');
});

test('cannot update closed support ticket via API', function () {
    $ticket = SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'Closed ticket',
        'description' => 'Description',
        'priority' => 'low',
        'category' => 'general',
        'status' => 'closed',
        'closed_at' => now(),
    ]);

    $response = $this->putJson("/api/v1/support-tickets/{$ticket->id}", [
        'subject' => 'Should not update',
    ]);

    $response->assertStatus(422);
});

// ─── Delete ───

test('can delete a closed support ticket via API', function () {
    $ticket = SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'To delete',
        'description' => 'Description',
        'priority' => 'low',
        'category' => 'general',
        'status' => 'closed',
        'closed_at' => now(),
    ]);

    $response = $this->deleteJson("/api/v1/support-tickets/{$ticket->id}");

    $response->assertOk();
    expect(SupportTicket::find($ticket->id))->toBeNull();
});

test('cannot delete non-closed support ticket via API', function () {
    $ticket = SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'Active ticket',
        'description' => 'Description',
        'priority' => 'medium',
        'category' => 'general',
        'status' => 'open',
    ]);

    $response = $this->deleteJson("/api/v1/support-tickets/{$ticket->id}");

    $response->assertStatus(422);
});

// ─── Workflow: Assign ───

test('can assign a support ticket via API', function () {
    $assignee = User::create([
        'name' => 'Assignee User',
        'email' => 'assignee@test.com',
        'email_verified_at' => now(),
        'password' => bcrypt('password'),
        'tenant_id' => $this->tenant->id,
        'is_active' => true,
    ]);

    $ticket = SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'Assign test',
        'description' => 'Please assign this.',
        'priority' => 'high',
        'category' => 'technical',
        'status' => 'new',
    ]);

    $response = $this->postJson("/api/v1/support-tickets/{$ticket->id}/assign", [
        'assignee_id' => $assignee->id,
    ]);

    $response->assertOk();
    expect($ticket->fresh()->assignee_id)->toBe($assignee->id);
    expect($ticket->fresh()->status)->toBe('assigned');
});

test('cannot assign closed support ticket via API', function () {
    $ticket = SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'Closed ticket',
        'description' => 'Description',
        'priority' => 'low',
        'category' => 'general',
        'status' => 'closed',
        'closed_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/support-tickets/{$ticket->id}/assign", [
        'assignee_id' => $this->user->id,
    ]);

    $response->assertStatus(422);
});

// ─── Workflow: Resolve ───

test('can resolve a support ticket via API', function () {
    $ticket = SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'Resolve test',
        'description' => 'Please resolve.',
        'priority' => 'medium',
        'category' => 'general',
        'status' => 'open',
    ]);

    $response = $this->postJson("/api/v1/support-tickets/{$ticket->id}/resolve");

    $response->assertOk();
    expect($ticket->fresh()->status)->toBe('resolved');
    expect($ticket->fresh()->resolved_at)->not->toBeNull();
});

test('cannot resolve already resolved ticket via API', function () {
    $ticket = SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'Already resolved',
        'description' => 'Description',
        'priority' => 'low',
        'category' => 'general',
        'status' => 'resolved',
        'resolved_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/support-tickets/{$ticket->id}/resolve");

    $response->assertStatus(422);
});

// ─── Workflow: Close ───

test('can close a support ticket via API', function () {
    $ticket = SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'Close test',
        'description' => 'Please close.',
        'priority' => 'low',
        'category' => 'general',
        'status' => 'resolved',
        'resolved_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/support-tickets/{$ticket->id}/close");

    $response->assertOk();
    expect($ticket->fresh()->status)->toBe('closed');
    expect($ticket->fresh()->closed_at)->not->toBeNull();
});

test('cannot close already closed ticket via API', function () {
    $ticket = SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'Already closed',
        'description' => 'Description',
        'priority' => 'low',
        'category' => 'general',
        'status' => 'closed',
        'closed_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/support-tickets/{$ticket->id}/close");

    $response->assertStatus(422);
});

// ─── Workflow: Reopen ───

test('can reopen a closed support ticket via API', function () {
    $ticket = SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'Reopen test',
        'description' => 'Please reopen.',
        'priority' => 'medium',
        'category' => 'technical',
        'status' => 'closed',
        'closed_at' => now(),
    ]);

    $response = $this->postJson("/api/v1/support-tickets/{$ticket->id}/reopen");

    $response->assertOk();
    expect($ticket->fresh()->status)->toBe('open');
    expect($ticket->fresh()->closed_at)->toBeNull();
    expect($ticket->fresh()->resolved_at)->toBeNull();
});

test('cannot reopen non-closed support ticket via API', function () {
    $ticket = SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'requester_id' => $this->user->id,
        'subject' => 'Open ticket',
        'description' => 'Description',
        'priority' => 'low',
        'category' => 'general',
        'status' => 'open',
    ]);

    $response = $this->postJson("/api/v1/support-tickets/{$ticket->id}/reopen");

    $response->assertStatus(422);
});
