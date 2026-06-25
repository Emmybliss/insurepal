<?php

namespace Tests\Feature\Mobile;

use App\Models\Claim;
use App\Models\Customer;
use App\Models\Notification;
use App\Models\Policy;
use App\Models\PolicyProduct;
use App\Models\PolicyType;
use App\Models\Quote;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MobileApiTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private Customer $customer;

    private Policy $policy;

    private Quote $quote;

    private Claim $claim;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create([
            'type' => 'broker',
            'subscription_status' => 'active',
        ]);

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'type' => 'individual',
            'first_name' => 'Alice',
            'last_name' => 'Johnson',
            'is_active' => true,
        ]);

        $policyType = PolicyType::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $policyProduct = PolicyProduct::factory()->create([
            'tenant_id' => $this->tenant->id,
            'policy_type_id' => $policyType->id,
        ]);

        $this->policy = Policy::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'policy_product_id' => $policyProduct->id,
            'status' => Policy::STATUS_ACTIVE,
            'effective_date' => now(),
            'expiry_date' => now()->addYear(),
        ]);

        $this->quote = Quote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $policyProduct->id,
            'status' => 'draft',
            'valid_until' => now()->addDays(30),
        ]);

        $this->claim = Claim::factory()->create([
            'tenant_id' => $this->tenant->id,
            'policy_id' => $this->policy->id,
            'customer_id' => $this->customer->id,
            'status' => Claim::STATUS_SUBMITTED,
            'claim_type' => Claim::TYPE_ACCIDENT,
        ]);
    }

    public function test_mobile_login_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/mobile/auth/login', [
            'email' => $this->user->email,
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Login successful',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'token',
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'phone',
                        'avatar_url',
                        'roles',
                        'is_active',
                    ],
                ],
            ]);

        $this->assertNotEmpty($response->json('data.token'));
        $this->assertEquals($this->user->email, $response->json('data.user.email'));
    }

    public function test_mobile_login_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/mobile/auth/login', [
            'email' => $this->user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid credentials',
            ]);
    }

    public function test_mobile_login_with_nonexistent_user(): void
    {
        $response = $this->postJson('/api/mobile/auth/login', [
            'email' => 'nonexistent@test.com',
            'password' => 'password',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid credentials',
            ]);
    }

    public function test_mobile_login_requires_email_and_password(): void
    {
        $response = $this->postJson('/api/mobile/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_mobile_login_blocks_revoked_access(): void
    {
        $this->user->update(['login_access' => false]);

        $response = $this->postJson('/api/mobile/auth/login', [
            'email' => $this->user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_mobile_login_updates_last_login_at(): void
    {
        $this->assertNull($this->user->last_login_at);

        $this->postJson('/api/mobile/auth/login', [
            'email' => $this->user->email,
            'password' => 'password',
        ]);

        $this->user->refresh();
        $this->assertNotNull($this->user->last_login_at);
    }

    public function test_mobile_logout(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/mobile/auth/logout');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Logged out successfully',
            ]);
    }

    public function test_mobile_me_returns_user_data(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/mobile/auth/me');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'User fetched successfully',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'roles',
                    ],
                    'tenant' => [
                        'id',
                        'name',
                        'type',
                    ],
                    'permissions',
                    'subscription',
                    'unread_notifications_count',
                ],
            ]);

        $this->assertEquals($this->user->name, $response->json('data.user.name'));
        $this->assertEquals($this->tenant->name, $response->json('data.tenant.name'));
    }

    public function test_mobile_me_requires_authentication(): void
    {
        $response = $this->getJson('/api/mobile/auth/me');

        $response->assertUnauthorized();
    }

    public function test_mobile_dashboard_returns_stats(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/mobile/dashboard');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Dashboard data fetched successfully',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'stats' => [
                        'active_policies_count',
                        'pending_claims_count',
                        'expiring_soon_count',
                        'outstanding_notes_count',
                    ],
                    'recent_notifications',
                    'recent_clients',
                    'recent_policies',
                    'quick_links',
                ],
            ]);

        $this->assertEquals(1, $response->json('data.stats.active_policies_count'));
        $this->assertEquals(1, $response->json('data.stats.pending_claims_count'));
    }

    public function test_mobile_dashboard_requires_authentication(): void
    {
        $response = $this->getJson('/api/mobile/dashboard');

        $response->assertUnauthorized();
    }

    public function test_mobile_clients_list(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/mobile/clients');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Clients fetched successfully',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'meta' => [
                    'current_page',
                    'per_page',
                    'total',
                    'last_page',
                ],
            ]);

        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Alice Johnson', $response->json('data.0.name'));
    }

    public function test_mobile_clients_list_with_search(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/mobile/clients?search=Alice');

        $response->assertOk()
            ->assertJson([
                'success' => true,
            ]);

        $this->assertCount(1, $response->json('data'));
    }

    public function test_mobile_clients_list_with_type_filter(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/mobile/clients?type=individual');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));

        $response = $this->getJson('/api/mobile/clients?type=corporate');
        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }

    public function test_mobile_clients_list_paginates(): void
    {
        Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'type' => 'individual',
            'first_name' => 'Bob',
            'last_name' => 'Wilson',
            'is_active' => true,
        ]);

        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/mobile/clients?per_page=1');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals(1, $response->json('meta.per_page'));
        $this->assertEquals(2, $response->json('meta.total'));
    }

    public function test_mobile_clients_create(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/mobile/clients', [
            'type' => 'individual',
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane@test.com',
            'phone' => '+4444444444',
        ]);

        $response->assertCreated()
            ->assertJson([
                'success' => true,
                'message' => 'Client created successfully',
            ]);

        $this->assertDatabaseHas('customers', [
            'email' => 'jane@test.com',
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'tenant_id' => $this->tenant->id,
        ]);
    }

    public function test_mobile_clients_create_returns_existing_customer(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/mobile/clients', [
            'type' => 'individual',
            'first_name' => 'Alice',
            'last_name' => 'Johnson',
            'email' => $this->customer->email,
            'phone' => $this->customer->phone,
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Customer already exists',
            ]);

        $this->assertEquals(1, Customer::where('email', $this->customer->email)->count());
    }

    public function test_mobile_clients_create_validates_required_fields(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/mobile/clients', [
            'type' => 'individual',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['first_name', 'last_name', 'email', 'phone']);
    }

    public function test_mobile_clients_show(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/mobile/clients/'.$this->customer->id);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Client fetched successfully',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'type',
                    'name',
                    'email',
                    'phone',
                    'policies',
                    'claims',
                ],
            ]);

        $this->assertEquals('Alice Johnson', $response->json('data.name'));
    }

    public function test_mobile_clients_update(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->putJson('/api/mobile/clients/'.$this->customer->id, [
            'first_name' => 'Alice Updated',
            'phone' => '+9999999999',
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Client updated successfully',
            ]);

        $this->customer->refresh();
        $this->assertEquals('Alice Updated', $this->customer->first_name);
    }

    public function test_mobile_clients_delete(): void
    {
        Sanctum::actingAs($this->user);

        $newCustomer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'type' => 'individual',
            'first_name' => 'Delete',
            'last_name' => 'Me',
            'is_active' => true,
        ]);

        $response = $this->deleteJson('/api/mobile/clients/'.$newCustomer->id);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Client deleted successfully',
            ]);

        $this->assertDatabaseMissing('customers', ['id' => $newCustomer->id]);
    }

    public function test_mobile_clients_delete_fails_with_policies(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->deleteJson('/api/mobile/clients/'.$this->customer->id);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Cannot delete client with associated policies',
            ]);

        $this->assertDatabaseHas('customers', ['id' => $this->customer->id]);
    }

    public function test_mobile_policies_list(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/mobile/policies');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Policies fetched successfully',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'meta',
            ]);

        $this->assertCount(1, $response->json('data'));
    }

    public function test_mobile_policies_list_with_search(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/mobile/policies?search=Alice');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_mobile_policies_list_with_status_filter(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/mobile/policies?status=active');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));

        $response = $this->getJson('/api/mobile/policies?status=expired');
        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }

    public function test_mobile_policies_show(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/mobile/policies/'.$this->policy->id);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Policy fetched successfully',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'policy_number',
                    'status',
                    'customer',
                    'product',
                    'premium_amount',
                    'documents',
                    'debit_notes',
                ],
            ]);
    }

    public function test_mobile_claims_list(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/mobile/claims');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Claims fetched successfully',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'meta',
            ]);

        $this->assertCount(1, $response->json('data'));
    }

    public function test_mobile_claims_list_with_status_filter(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/mobile/claims?status=submitted');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));

        $response = $this->getJson('/api/mobile/claims?status=approved');
        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }

    public function test_mobile_claims_create(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/mobile/claims', [
            'policy_id' => $this->policy->id,
            'customer_id' => $this->customer->id,
            'claim_type' => Claim::TYPE_THEFT,
            'incident_date' => now()->format('Y-m-d'),
            'incident_description' => 'Test theft incident',
            'claim_amount' => 25000,
        ]);

        $response->assertCreated()
            ->assertJson([
                'success' => true,
                'message' => 'Claim submitted successfully',
            ]);

        $this->assertDatabaseHas('claims', [
            'tenant_id' => $this->tenant->id,
            'claim_type' => Claim::TYPE_THEFT,
            'incident_description' => 'Test theft incident',
        ]);
    }

    public function test_mobile_claims_create_validates_policy_customer_match(): void
    {
        Sanctum::actingAs($this->user);

        $otherCustomer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'type' => 'corporate',
            'company_name' => 'Other Corp',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/mobile/claims', [
            'policy_id' => $this->policy->id,
            'customer_id' => $otherCustomer->id,
            'claim_type' => Claim::TYPE_ACCIDENT,
            'incident_date' => now()->format('Y-m-d'),
            'incident_description' => 'Test incident',
            'claim_amount' => 10000,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Policy does not belong to the specified customer',
            ]);
    }

    public function test_mobile_claims_show(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/mobile/claims/'.$this->claim->id);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Claim fetched successfully',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'claim_reference',
                    'status',
                    'claim_type',
                    'incident_date',
                    'claim_amount',
                    'customer',
                    'policy',
                    'documents',
                    'comments',
                    'activities',
                ],
            ]);
    }

    public function test_mobile_claims_update(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->putJson('/api/mobile/claims/'.$this->claim->id, [
            'incident_description' => 'Updated description',
            'claim_amount' => 60000,
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Claim updated successfully',
            ]);

        $this->claim->refresh();
        $this->assertEquals('Updated description', $this->claim->incident_description);
    }

    public function test_mobile_quotes_list(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/mobile/quotes');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Quotes fetched successfully',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'meta',
            ]);

        $this->assertCount(1, $response->json('data'));
    }

    public function test_mobile_quotes_show(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/mobile/quotes/'.$this->quote->id);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Quote fetched successfully',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'quote_number',
                    'status',
                    'customer',
                    'product',
                    'premium_amount',
                ],
            ]);
    }

    public function test_mobile_notifications_list(): void
    {
        Sanctum::actingAs($this->user);

        Notification::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
        ]);

        $response = $this->getJson('/api/mobile/notifications');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Notifications fetched successfully',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'meta' => [
                    'unread_count',
                ],
            ]);

        $this->assertCount(1, $response->json('data'));
    }

    public function test_mobile_notifications_list_with_unread_filter(): void
    {
        Sanctum::actingAs($this->user);

        Notification::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'read_at' => now(),
        ]);

        Notification::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'read_at' => null,
        ]);

        $response = $this->getJson('/api/mobile/notifications?unread=true');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
    }

    public function test_mobile_notifications_mark_read(): void
    {
        Sanctum::actingAs($this->user);

        $notification = Notification::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'read_at' => null,
        ]);

        $response = $this->postJson('/api/mobile/notifications/'.$notification->id.'/read');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Notification marked as read',
            ]);

        $notification->refresh();
        $this->assertNotNull($notification->read_at);
    }

    public function test_mobile_notifications_mark_all_read(): void
    {
        Sanctum::actingAs($this->user);

        Notification::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'read_at' => null,
        ]);

        $response = $this->postJson('/api/mobile/notifications/read-all');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'All notifications marked as read',
            ]);

        $unreadCount = Notification::where('user_id', $this->user->id)
            ->whereNull('read_at')
            ->count();

        $this->assertEquals(0, $unreadCount);
    }

    public function test_mobile_notifications_delete(): void
    {
        Sanctum::actingAs($this->user);

        $notification = Notification::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
        ]);

        $response = $this->deleteJson('/api/mobile/notifications/'.$notification->id);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Notification deleted',
            ]);

        $this->assertDatabaseMissing('notifications', ['id' => $notification->id]);
    }

    public function test_mobile_api_enforces_tenant_isolation(): void
    {
        $tenant2 = Tenant::factory()->create([
            'type' => 'broker',
            'subscription_status' => 'active',
        ]);

        $user2 = User::factory()->create([
            'tenant_id' => $tenant2->id,
        ]);

        $customer2 = Customer::factory()->create([
            'tenant_id' => $tenant2->id,
            'type' => 'corporate',
            'company_name' => 'Another Corp',
            'is_active' => true,
        ]);

        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/mobile/clients');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Alice Johnson', $response->json('data.0.name'));

        Sanctum::actingAs($user2);

        $response = $this->getJson('/api/mobile/clients');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Another Corp', $response->json('data.0.name'));
    }

    public function test_mobile_api_returns_401_for_unauthenticated_requests(): void
    {
        $endpoints = [
            ['GET', '/api/mobile/auth/me'],
            ['GET', '/api/mobile/dashboard'],
            ['GET', '/api/mobile/clients'],
            ['GET', '/api/mobile/policies'],
            ['GET', '/api/mobile/claims'],
            ['GET', '/api/mobile/quotes'],
            ['GET', '/api/mobile/notifications'],
        ];

        foreach ($endpoints as [$method, $uri]) {
            $response = match ($method) {
                'GET' => $this->getJson($uri),
                'POST' => $this->postJson($uri),
                'PUT' => $this->putJson($uri),
                'DELETE' => $this->deleteJson($uri),
            };

            $response->assertUnauthorized();
        }
    }
}
