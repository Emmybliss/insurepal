<?php

use App\Models\Conversation;
use App\Models\Customer;
use App\Models\Policy;
use App\Models\Tenant;
use App\Models\ToolExecution;
use App\Models\User;
use App\Services\AI\AIAssistantService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create(['status' => 'active']);
    app()->instance('tenant', $this->tenant);

    $this->user = User::factory()->create([
        'tenant_id' => $this->tenant->id,
        'is_active' => true,
    ]);

    $this->token = $this->user->createToken('test-token')->plainTextToken;
    $this->withHeader('Authorization', "Bearer {$this->token}");
});

// ─── Chat ───

test('can send a chat message', function () {
    $mock = Mockery::mock(AIAssistantService::class);
    $mock->shouldReceive('chat')
        ->once()
        ->andReturn([
            'conversation_id' => 1,
            'message' => 'I can help you with that.',
            'usage' => ['prompt_tokens' => 10, 'completion_tokens' => 20],
            'model' => 'gpt-4o',
        ]);

    $this->app->instance(AIAssistantService::class, $mock);

    $response = $this->postJson('/api/v1/ai/chat', [
        'message' => 'Show me active policies',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => ['conversation_id', 'message', 'usage', 'model'],
        ]);
});

test('chat requires a message', function () {
    $response = $this->postJson('/api/v1/ai/chat', []);

    $response->assertStatus(422);
});

test('chat message must be a string', function () {
    $response = $this->postJson('/api/v1/ai/chat', [
        'message' => 123,
    ]);

    $response->assertStatus(422);
});

test('chat message must not exceed 10000 characters', function () {
    $response = $this->postJson('/api/v1/ai/chat', [
        'message' => str_repeat('a', 10001),
    ]);

    $response->assertStatus(422);
});

test('chat requires authentication', function () {
    $this->withoutHeader('Authorization');

    $response = $this->postJson('/api/v1/ai/chat', [
        'message' => 'Hello',
    ]);

    $response->assertStatus(401);
});

// ─── Conversations ───

test('can list conversations', function () {
    Conversation::factory()->count(3)->create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $this->user->id,
    ]);

    $response = $this->getJson('/api/v1/ai/conversations');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data',
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
        ]);

    expect($response->json('meta.total'))->toBe(3);
});

test('lists only own conversations', function () {
    Conversation::factory()->create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $this->user->id,
    ]);

    $otherUser = User::factory()->create(['tenant_id' => $this->tenant->id]);
    Conversation::factory()->create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $otherUser->id,
    ]);

    $response = $this->getJson('/api/v1/ai/conversations');

    expect($response->json('meta.total'))->toBe(1);
});

test('can show a conversation with messages', function () {
    $conversation = Conversation::factory()->create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $this->user->id,
    ]);

    $conversation->messages()->create([
        'conversation_id' => $conversation->id,
        'role' => 'user',
        'content' => 'Hello',
    ]);

    $response = $this->getJson("/api/v1/ai/conversations/{$conversation->id}");

    $response->assertOk()
        ->assertJsonPath('data.id', $conversation->id)
        ->assertJsonStructure(['data' => ['id', 'messages']]);
});

test('cannot show another users conversation', function () {
    $otherUser = User::factory()->create(['tenant_id' => $this->tenant->id]);
    $conversation = Conversation::factory()->create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $otherUser->id,
    ]);

    $response = $this->getJson("/api/v1/ai/conversations/{$conversation->id}");

    $response->assertStatus(404);
});

test('can delete a conversation', function () {
    $conversation = Conversation::factory()->create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $this->user->id,
    ]);

    $response = $this->deleteJson("/api/v1/ai/conversations/{$conversation->id}");

    $response->assertOk();
    expect($response->json('message'))->toBe('Conversation deleted');
});

test('cannot delete another users conversation', function () {
    $otherUser = User::factory()->create(['tenant_id' => $this->tenant->id]);
    $conversation = Conversation::factory()->create([
        'tenant_id' => $this->tenant->id,
        'user_id' => $otherUser->id,
    ]);

    $response = $this->deleteJson("/api/v1/ai/conversations/{$conversation->id}");

    $response->assertStatus(404);
});

// ─── Approvals ───

test('can list pending approvals', function () {
    ToolExecution::factory()->count(2)->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'pending',
    ]);

    ToolExecution::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'approved',
    ]);

    $response = $this->getJson('/api/v1/ai/approvals');

    $response->assertOk();
    expect($response->json('meta.total'))->toBe(2);
});

test('can approve a pending action', function () {
    $execution = ToolExecution::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'pending',
    ]);

    $response = $this->postJson("/api/v1/ai/approvals/{$execution->id}/approve");

    $response->assertOk();
    expect($execution->fresh()->status)->toBe('approved');
    expect($execution->fresh()->approved_by)->toBe($this->user->id);
});

test('can reject a pending action', function () {
    $execution = ToolExecution::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'pending',
    ]);

    $response = $this->postJson("/api/v1/ai/approvals/{$execution->id}/reject");

    $response->assertOk();
    expect($execution->fresh()->status)->toBe('rejected');
});

test('cannot approve an already approved action', function () {
    $execution = ToolExecution::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'approved',
    ]);

    $response = $this->postJson("/api/v1/ai/approvals/{$execution->id}/approve");

    $response->assertStatus(404);
});

test('cannot approve another tenants action', function () {
    $otherTenant = Tenant::factory()->create(['status' => 'active']);
    $execution = ToolExecution::factory()->create([
        'tenant_id' => $otherTenant->id,
        'status' => 'pending',
    ]);

    $response = $this->postJson("/api/v1/ai/approvals/{$execution->id}/approve");

    $response->assertStatus(404);
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

    expect($response->json('data'))->toHaveCount(1); // Only generic "Generate report"
    expect($response->json('data.0.label'))->toBe('Generate a report');
});

test('suggestions include expiring policies', function () {
    Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'active',
        'expiry_date' => now()->addDays(15),
    ]);

    $response = $this->getJson('/api/v1/ai/suggestions');

    $labels = collect($response->json('data'))->pluck('label')->toArray();
    expect($labels)->toContain('Renew expiring policies');
});

test('suggestions include pending claims', function () {
    $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'individual']);

    \App\Models\Claim::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $customer->id,
        'status' => 'submitted',
    ]);

    $response = $this->getJson('/api/v1/ai/suggestions');

    $labels = collect($response->json('data'))->pluck('label')->toArray();
    expect($labels)->toContain('Review pending claims');
});

// ─── Tenant Isolation ───

test('approvals are scoped to tenant', function () {
    $otherTenant = Tenant::factory()->create(['status' => 'active']);
    ToolExecution::factory()->count(3)->create([
        'tenant_id' => $otherTenant->id,
        'status' => 'pending',
    ]);

    $response = $this->getJson('/api/v1/ai/approvals');

    expect($response->json('meta.total'))->toBe(0);
});
