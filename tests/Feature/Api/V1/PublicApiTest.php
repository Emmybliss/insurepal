<?php

namespace Tests\Feature\Api\V1;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicApiTest extends TestCase
{
    use RefreshDatabase;

    protected $tenant;

    protected $apiKey;

    protected $publicKey;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create([
            'status' => 'active',
        ]);

        $this->tenant->update([
            'api_key' => 'sk_test_12345',
            'public_key' => 'pk_test_12345',
        ]);

        $this->apiKey = 'sk_test_12345';
        $this->publicKey = 'pk_test_12345';
    }

    public function test_cannot_access_api_without_key()
    {
        $response = $this->getJson('/api/v1/products');
        $response->assertStatus(401);
    }

    public function test_can_access_products_with_api_key()
    {
        $response = $this->withHeaders([
            'X-API-KEY' => $this->apiKey,
        ])->getJson('/api/v1/products');

        $response->assertStatus(200);
    }

    public function test_widget_can_access_products_with_public_key()
    {
        $response = $this->withHeaders([
            'X-Tenant-Key' => $this->publicKey,
        ])->getJson('/api/v1/widget/products');

        $response->assertStatus(200);
    }

    public function test_invalid_api_key_rejected()
    {
        $response = $this->withHeaders([
            'X-API-KEY' => 'wrong_key',
        ])->getJson('/api/v1/products');

        $response->assertStatus(401);
    }
}
