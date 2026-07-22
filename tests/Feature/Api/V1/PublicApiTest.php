<?php

namespace Tests\Feature\Api\V1;

use App\Models\Tenant;
use App\Models\TenantApiKey;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicApiTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;

    protected string $apiKey;

    protected string $publicKey;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create([
            'status' => 'active',
        ]);

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
    }

    public function test_cannot_access_api_without_key(): void
    {
        $response = $this->getJson('/api/v1/products');
        $response->assertStatus(401);
    }

    public function test_can_access_products_with_api_key(): void
    {
        $response = $this->withHeaders([
            'X-API-KEY' => $this->apiKey,
        ])->getJson('/api/v1/products');

        $response->assertStatus(200);
    }

    public function test_widget_can_access_products_with_public_key(): void
    {
        $response = $this->withHeaders([
            'X-Tenant-Key' => $this->publicKey,
        ])->getJson('/api/v1/widget/products');

        $response->assertStatus(200);
    }

    public function test_invalid_api_key_rejected(): void
    {
        $response = $this->withHeaders([
            'X-API-KEY' => 'wrong_key',
        ])->getJson('/api/v1/products');

        $response->assertStatus(401);
    }
}
