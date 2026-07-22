<?php

use App\Models\Conversation;
use App\Models\Tenant;
use App\Models\ToolExecution;
use App\Models\User;
use Illuminate\Support\Facades\Http;
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

    $this->conversation = Conversation::create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $this->user->id,
        'title' => 'Test Conversation',
    ]);
});

// ─── Authentication ───

test('unauthenticated users cannot access AI endpoints', function () {
    $this->withHeaders(['Authorization' => 'Bearer invalid']);

    $this->getJson('/api/v1/ai/conversations')->assertStatus(401);
    $this->postJson('/api/v1/ai/chat', ['message' => 'test'])->assertStatus(401);
    $this->getJson('/api/v1/ai/approvals')->assertStatus(401);
});

// ─── Chat Validation ───

test('chat requires a message', function () {
    $response = $this->postJson('/api/v1/ai/chat', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['message']);
});

test('chat message must be a string', function () {
    $response = $this->postJson('/api/v1/ai/chat', [
        'message' => 123,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['message']);
});

test('chat rejects invalid context_type', function () {
    $response = $this->postJson('/api/v1/ai/chat', [
        'message' => 'Hello',
        'context_type' => 'invalid_type',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['context_type']);
});

test('chat requires context_id when context_type is provided', function () {
    $response = $this->postJson('/api/v1/ai/chat', [
        'message' => 'Hello',
        'context_type' => 'policy',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['context_id']);
});

test('chat rejects non-existent conversation_id', function () {
    $response = $this->postJson('/api/v1/ai/chat', [
        'message' => 'Hello',
        'conversation_id' => 99999,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['conversation_id']);
});

// ─── Conversations ───

test('can list conversations', function () {
    Conversation::create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $this->user->id,
        'title' => 'Another Conversation',
    ]);

    $response = $this->getJson('/api/v1/ai/conversations');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => [
                '*' => ['id', 'title', 'created_at', 'updated_at'],
            ],
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
        ]);

    expect($response->json('meta.total'))->toBe(2);
});

test('list conversations respects tenant isolation', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    $otherUser = User::create(['name' => 'Other', 'email' => 'other@test.com', 'email_verified_at' => now(), 'password' => bcrypt('password'), 'tenant_id' => $otherTenant->id, 'is_active' => true]);

    Conversation::withoutTenantScope()->create([
        'tenant_id' => $otherTenant->id,
        'user_id' => $otherUser->id,
        'title' => 'Other Conversation',
    ]);

    $response = $this->getJson('/api/v1/ai/conversations');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(1);
});

test('can show a conversation with messages', function () {
    $this->conversation->messages()->create([
        'role' => 'user',
        'content' => 'Hello',
    ]);

    $response = $this->getJson("/api/v1/ai/conversations/{$this->conversation->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $this->conversation->id)
        ->assertJsonStructure(['data' => ['messages']]);

    expect($response->json('data.messages'))->toHaveCount(1);
});

test('cannot show conversation from another tenant', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    $otherUser = User::create(['name' => 'Other', 'email' => 'other@test.com', 'email_verified_at' => now(), 'password' => bcrypt('password'), 'tenant_id' => $otherTenant->id, 'is_active' => true]);

    $conversation = Conversation::withoutTenantScope()->create([
        'tenant_id' => $otherTenant->id,
        'user_id' => $otherUser->id,
        'title' => 'Other Conversation',
    ]);

    $response = $this->getJson("/api/v1/ai/conversations/{$conversation->id}");

    $response->assertNotFound();
});

test('can delete a conversation', function () {
    $response = $this->deleteJson("/api/v1/ai/conversations/{$this->conversation->id}");

    $response->assertOk()
        ->assertJsonPath('message', 'Conversation deleted');

    expect(Conversation::find($this->conversation->id))->toBeNull();
});

test('cannot delete conversation from another tenant', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    $otherUser = User::create(['name' => 'Other', 'email' => 'other@test.com', 'email_verified_at' => now(), 'password' => bcrypt('password'), 'tenant_id' => $otherTenant->id, 'is_active' => true]);

    $conversation = Conversation::withoutTenantScope()->create([
        'tenant_id' => $otherTenant->id,
        'user_id' => $otherUser->id,
        'title' => 'Other Conversation',
    ]);

    $response = $this->deleteJson("/api/v1/ai/conversations/{$conversation->id}");

    $response->assertNotFound();
});

// ─── Approvals ───

test('can list pending approvals', function () {
    ToolExecution::create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $this->user->id,
        'conversation_id' => $this->conversation->id,
        'tool_name' => 'issue_policy',
        'parameters' => ['policy_id' => 1],
        'status' => 'pending',
    ]);

    ToolExecution::create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $this->user->id,
        'conversation_id' => $this->conversation->id,
        'tool_name' => 'create_debit_note',
        'parameters' => ['amount' => 5000],
        'status' => 'pending',
    ]);

    $response = $this->getJson('/api/v1/ai/approvals');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => [
                '*' => ['id', 'tool_name', 'status', 'parameters'],
            ],
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
        ]);

    expect($response->json('meta.total'))->toBe(2);
});

test('approvals only returns pending items', function () {
    ToolExecution::create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $this->user->id,
        'conversation_id' => $this->conversation->id,
        'tool_name' => 'issue_policy',
        'parameters' => [],
        'status' => 'pending',
    ]);

    ToolExecution::create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $this->user->id,
        'conversation_id' => $this->conversation->id,
        'tool_name' => 'issue_policy',
        'parameters' => [],
        'status' => 'approved',
    ]);

    $response = $this->getJson('/api/v1/ai/approvals');

    expect($response->json('meta.total'))->toBe(1);
});

test('can approve a pending action', function () {
    $execution = ToolExecution::create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $this->user->id,
        'conversation_id' => $this->conversation->id,
        'tool_name' => 'issue_policy',
        'parameters' => ['policy_id' => 1],
        'status' => 'pending',
    ]);

    $response = $this->postJson("/api/v1/ai/approvals/{$execution->id}/approve");

    $response->assertOk()
        ->assertJsonPath('message', 'Action approved');

    $execution->refresh();
    expect($execution->status)->toBe('approved');
    expect($execution->approved_by)->toBe($this->user->id);
    expect($execution->approved_at)->not->toBeNull();
});

test('can reject a pending action', function () {
    $execution = ToolExecution::create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $this->user->id,
        'conversation_id' => $this->conversation->id,
        'tool_name' => 'issue_policy',
        'parameters' => ['policy_id' => 1],
        'status' => 'pending',
    ]);

    $response = $this->postJson("/api/v1/ai/approvals/{$execution->id}/reject");

    $response->assertOk()
        ->assertJsonPath('message', 'Action rejected');

    $execution->refresh();
    expect($execution->status)->toBe('rejected');
});

test('cannot approve already-approved action', function () {
    $execution = ToolExecution::create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $this->user->id,
        'conversation_id' => $this->conversation->id,
        'tool_name' => 'issue_policy',
        'parameters' => [],
        'status' => 'approved',
        'approved_by' => $this->user->id,
        'approved_at' => now(),
    ]);

    $this->postJson("/api/v1/ai/approvals/{$execution->id}/approve")->assertNotFound();
});

test('cannot approve action from another tenant', function () {
    $otherTenant = Tenant::create(['name' => 'Other', 'type' => 'broker', 'status' => 'active', 'onboarding_completed' => true, 'email' => 'other@test.com']);
    $otherConversation = Conversation::withoutTenantScope()->create([
        'tenant_id' => $otherTenant->id,
        'user_id' => $this->user->id,
        'title' => 'Other Conversation',
    ]);

    $execution = ToolExecution::withoutTenantScope()->create([
        'tenant_id' => $otherTenant->id,
        'user_id' => $this->user->id,
        'conversation_id' => $otherConversation->id,
        'tool_name' => 'issue_policy',
        'parameters' => [],
        'status' => 'pending',
    ]);

    $this->postJson("/api/v1/ai/approvals/{$execution->id}/approve")->assertNotFound();
});

// ─── Suggestions ───

test('can get suggestions', function () {
    $response = $this->getJson('/api/v1/ai/suggestions');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => [
                '*' => ['label', 'description', 'prompt'],
            ],
        ]);

    expect($response->json('data'))->toBeArray();
    expect(count($response->json('data')))->toBeGreaterThanOrEqual(1);
});

test('suggestions include generate report option', function () {
    $response = $this->getJson('/api/v1/ai/suggestions');

    $labels = array_column($response->json('data'), 'label');
    expect(in_array('Generate a report', $labels))->toBeTrue();
});

// ─── Chat (mocked AI response) ───

test('chat endpoint returns response with mocked AI', function () {
    Http::fake([
        'api.openai.com/*' => Http::response([
            'choices' => [['message' => ['content' => 'I can help you with insurance questions.']]],
            'usage' => ['prompt_tokens' => 10, 'completion_tokens' => 20, 'total_tokens' => 30],
            'model' => 'gpt-4o',
        ]),
    ]);

    $response = $this->postJson('/api/v1/ai/chat', [
        'message' => 'Hello, how can you help me?',
    ]);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonStructure(['data' => ['conversation_id', 'message']]);
});
