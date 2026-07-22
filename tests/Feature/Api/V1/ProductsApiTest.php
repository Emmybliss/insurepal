<?php

use App\Models\PolicyClass;
use App\Models\PolicyProduct;
use App\Models\PolicyType;
use App\Models\Tenant;
use App\Models\TenantApiKey;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create(['status' => 'active']);

    $this->apiKey = 'sk_test_'.str_repeat('a', 32);
    $this->publicKey = 'pk_test_'.str_repeat('b', 32);

    TenantApiKey::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Test API Key',
        'token' => $this->apiKey,
        'token_hash' => hash('sha256', $this->apiKey),
        'public_key' => $this->publicKey,
        'last_4_chars' => substr($this->apiKey, -4),
        'scopes' => ['*'],
        'allowed_domains' => null,
        'is_active' => true,
    ]);
});

// ─── Helpers ───

function createProduct(Tenant $tenant, array $overrides = []): PolicyProduct
{
    $policyType = PolicyType::factory()->create();
    $policyClass = PolicyClass::factory()->create(['policy_type_id' => $policyType->id]);

    return PolicyProduct::factory()->create(array_merge([
        'tenant_id' => $tenant->id,
        'policy_type_id' => $policyType->id,
        'policy_class_id' => $policyClass->id,
    ], $overrides));
}

// ─── List Products ───

test('can list products via public API', function () {
    createProduct($this->tenant);
    createProduct($this->tenant);

    $response = $this->withHeaders(['X-API-KEY' => $this->apiKey])
        ->getJson('/api/v1/products');

    $response->assertOk();
    expect($response->json())->toBeArray();
    expect(count($response->json()))->toBe(2);
});

test('can list products via widget API', function () {
    createProduct($this->tenant);

    $response = $this->withHeaders([
        'X-Tenant-Key' => $this->publicKey,
        'Origin' => 'http://example.com',
    ])->getJson('/api/v1/widget/products');

    $response->assertOk();
    expect(count($response->json()))->toBe(1);
});

test('returns only active products', function () {
    createProduct($this->tenant, ['name' => 'Active Product', 'is_active' => true]);
    createProduct($this->tenant, ['name' => 'Inactive Product', 'is_active' => false]);

    $response = $this->withHeaders(['X-API-KEY' => $this->apiKey])
        ->getJson('/api/v1/products');

    expect(count($response->json()))->toBe(1);
    expect($response->json()[0]['name'])->toBe('Active Product');
});

test('returns products ordered by sort_order then name', function () {
    createProduct($this->tenant, ['name' => 'Z Policy', 'sort_order' => 1]);
    createProduct($this->tenant, ['name' => 'A Policy', 'sort_order' => 1]);
    createProduct($this->tenant, ['name' => 'B Policy', 'sort_order' => 2]);

    $response = $this->withHeaders(['X-API-KEY' => $this->apiKey])
        ->getJson('/api/v1/products');

    $names = collect($response->json())->pluck('name')->toArray();
    expect($names)->toBe(['A Policy', 'Z Policy', 'B Policy']);
});

test('includes policy type and class in response', function () {
    $policyType = PolicyType::factory()->create(['name' => 'Motor']);
    $policyClass = PolicyClass::factory()->create(['name' => 'Private', 'policy_type_id' => $policyType->id]);

    PolicyProduct::factory()->create([
        'tenant_id' => $this->tenant->id,
        'policy_type_id' => $policyType->id,
        'policy_class_id' => $policyClass->id,
    ]);

    $response = $this->withHeaders(['X-API-KEY' => $this->apiKey])
        ->getJson('/api/v1/products');

    expect($response->json()[0])->toHaveKey('policy_type');
    expect($response->json()[0]['policy_type']['name'])->toBe('Motor');
    expect($response->json()[0])->toHaveKey('policy_class');
    expect($response->json()[0]['policy_class']['name'])->toBe('Private');
});

// ─── Show Single Product ───

test('can show single product', function () {
    $product = createProduct($this->tenant);

    $response = $this->withHeaders(['X-API-KEY' => $this->apiKey])
        ->getJson("/api/v1/products/{$product->id}");

    $response->assertOk();
    expect($response->json('id'))->toBe($product->id);
});

test('returns 404 for non-existent product', function () {
    $response = $this->withHeaders(['X-API-KEY' => $this->apiKey])
        ->getJson('/api/v1/products/99999');

    $response->assertNotFound();
});

test('returns 404 for inactive product via show', function () {
    $product = createProduct($this->tenant, ['is_active' => false]);

    $response = $this->withHeaders(['X-API-KEY' => $this->apiKey])
        ->getJson("/api/v1/products/{$product->id}");

    $response->assertNotFound();
});

// ─── Auth ───

test('rejects request without api key', function () {
    $response = $this->getJson('/api/v1/products');

    $response->assertStatus(401);
});

test('rejects request with invalid api key', function () {
    $response = $this->withHeaders(['X-API-KEY' => 'invalid-key'])
        ->getJson('/api/v1/products');

    $response->assertStatus(401);
});

// ─── Tenant Isolation ───

test('scopes products to tenant', function () {
    $otherTenant = Tenant::factory()->create(['status' => 'active']);

    createProduct($this->tenant, ['name' => 'Our Product']);
    createProduct($otherTenant, ['name' => 'Their Product']);

    $response = $this->withHeaders(['X-API-KEY' => $this->apiKey])
        ->getJson('/api/v1/products');

    expect(count($response->json()))->toBe(1);
    expect($response->json()[0]['name'])->toBe('Our Product');
});
