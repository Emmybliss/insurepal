<?php

use App\Models\PolicyClass;
use App\Models\PolicyProduct;
use App\Models\PolicyType;
use App\Models\Tenant;
use App\Models\TenantApiKey;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->tenant = Tenant::create([
        'name' => 'Test Broker',
        'type' => 'broker',
        'status' => 'active',
        'email' => 'broker@test.com',
        'paystack_public_key' => 'pk_test_123',
        'paystack_secret_key' => 'sk_test_123',
        'trial_ends_at' => now()->addDays(14),
    ]);

    $this->user = User::create([
        'name' => 'Staff User',
        'email' => 'staff@test.com',
        'email_verified_at' => now(),
        'password' => bcrypt('password'),
        'tenant_id' => $this->tenant->id,
        'is_active' => true,
    ]);

    $this->apiKey = TenantApiKey::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Test Key',
        'token' => 'test-api-key-value',
        'token_hash' => hash('sha256', 'test-api-key-value'),
        'public_key' => 'pk_test_'.Str::random(32),
        'last_4_chars' => 'alue',
        'is_active' => true,
    ]);

    $policyType = PolicyType::create([
        'name' => 'Test Type',
        'code' => 'TEST',
        'is_active' => true,
    ]);

    $policyClass = PolicyClass::create([
        'policy_type_id' => $policyType->id,
        'name' => 'Test Class',
        'code' => 'TCLASS',
        'is_active' => true,
    ]);

    $this->product = PolicyProduct::create([
        'tenant_id' => $this->tenant->id,
        'policy_type_id' => $policyType->id,
        'policy_class_id' => $policyClass->id,
        'name' => 'Test Product',
        'code' => 'TPROD',
        'base_premium' => 50000,
        'is_active' => true,
    ]);
});

// ─── Initiate ───

test('requires API key for payment initiation', function () {
    $response = $this->postJson('/api/v1/payments/initiate', []);

    $response->assertStatus(401);
});

test('requires valid API key for payment initiation', function () {
    $response = $this->withHeaders(['X-API-KEY' => 'wrong-key'])
        ->postJson('/api/v1/payments/initiate', []);

    $response->assertStatus(401);
});

test('validates email for payment initiation', function () {
    $response = $this->withHeaders(['X-API-KEY' => 'test-api-key-value'])
        ->postJson('/api/v1/payments/initiate', [
            'policy_product_id' => $this->product->id,
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('validates policy_product_id for payment initiation', function () {
    $response = $this->withHeaders(['X-API-KEY' => 'test-api-key-value'])
        ->postJson('/api/v1/payments/initiate', [
            'email' => 'test@example.com',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['policy_product_id']);
});

test('validates policy_product_id exists for payment initiation', function () {
    $response = $this->withHeaders(['X-API-KEY' => 'test-api-key-value'])
        ->postJson('/api/v1/payments/initiate', [
            'email' => 'test@example.com',
            'policy_product_id' => 99999,
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['policy_product_id']);
});

test('returns 400 when tenant has no paystack keys', function () {
    $this->tenant->update([
        'paystack_secret_key' => null,
        'paystack_public_key' => null,
    ]);

    $response = $this->withHeaders(['X-API-KEY' => 'test-api-key-value'])
        ->postJson('/api/v1/payments/initiate', [
            'email' => 'test@example.com',
            'policy_product_id' => $this->product->id,
        ]);

    $response->assertStatus(400);
});

test('can initiate payment successfully', function () {
    Http::fake([
        'api.paystack.co/*' => Http::response([
            'status' => true,
            'message' => 'Authorization URL created',
            'data' => [
                'authorization_url' => 'https://checkout.paystack.com/abc123',
                'access_code' => 'abc123',
                'reference' => \Illuminate\Support\Str::random(12),
            ],
        ]),
    ]);

    $response = $this->withHeaders(['X-API-KEY' => 'test-api-key-value'])
        ->postJson('/api/v1/payments/initiate', [
            'email' => 'test@example.com',
            'policy_product_id' => $this->product->id,
            'metadata' => [
                'customer_data' => [
                    'first_name' => 'John',
                    'last_name' => 'Doe',
                ],
            ],
            'callback_url' => 'https://example.com/callback',
        ]);

    $response->assertOk()
        ->assertJsonStructure([
            'status',
            'message',
            'data' => [
                'authorization_url',
                'access_code',
                'reference',
                'paystack_public_key',
            ],
        ]);

    expect($response->json('data.paystack_public_key'))->toBe('pk_test_123');
});

// ─── Webhook ───

test('requires tenant_id for webhook', function () {
    $response = $this->postJson('/api/v1/payments/webhook/paystack', []);

    $response->assertStatus(400);
});

test('rejects webhook with invalid signature', function () {
    $response = $this->postJson(
        '/api/v1/payments/webhook/paystack?tenant_id='.$this->tenant->id,
        ['event' => 'charge.success', 'data' => []],
        ['X-Paystack-Signature' => 'bad-signature']
    );

    $response->assertStatus(400);
});

test('processes valid charge.success webhook', function () {
    $payload = [
        'event' => 'charge.success',
        'data' => [
            'amount' => 5000000,
            'customer' => [
                'email' => 'john@example.com',
            ],
            'metadata' => [
                'policy_product_id' => $this->product->id,
                'customer_data' => [
                    'first_name' => 'John',
                    'last_name' => 'Doe',
                ],
            ],
        ],
    ];

    $jsonPayload = json_encode($payload);
    $signature = hash_hmac('sha512', $jsonPayload, 'sk_test_123');

    $response = $this->postJson(
        '/api/v1/payments/webhook/paystack?tenant_id='.$this->tenant->id,
        $payload,
        ['X-Paystack-Signature' => $signature]
    );

    $response->assertOk();
    expect($response->json('status'))->toBe('success');
});

test('logs webhook events in webhook_logs table', function () {
    $payload = [
        'event' => 'charge.success',
        'data' => [
            'amount' => 5000000,
            'customer' => [
                'email' => 'john@example.com',
            ],
            'metadata' => [
                'policy_product_id' => $this->product->id,
                'customer_data' => [
                    'first_name' => 'John',
                    'last_name' => 'Doe',
                ],
            ],
        ],
    ];

    $jsonPayload = json_encode($payload);
    $signature = hash_hmac('sha512', $jsonPayload, 'sk_test_123');

    $this->postJson(
        '/api/v1/payments/webhook/paystack?tenant_id='.$this->tenant->id,
        $payload,
        ['X-Paystack-Signature' => $signature]
    );

    $this->assertDatabaseHas('webhook_logs', [
        'tenant_id' => $this->tenant->id,
        'gateway' => 'paystack',
        'event' => 'charge.success',
        'status' => 'processed',
    ]);
});
