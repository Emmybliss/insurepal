<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\InsuranceProduct;
use App\Models\Quote;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class QuoteCrudTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    private Tenant $tenant1;

    private Tenant $tenant2;

    private User $user1;

    private User $user2;

    private Customer $customer1;

    private Customer $customer2;

    private InsuranceProduct $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setupTestData();
        $this->setupPermissions();
    }

    private function setupTestData(): void
    {
        // Create tenants
        $this->tenant1 = Tenant::create([
            'name' => 'Test Insurance Broker',
            'type' => 'broker',
            'subscription_status' => 'active',
            'email' => 'broker@test.com',
            'phone' => '+1234567890',
        ]);

        $this->tenant2 = Tenant::create([
            'name' => 'Another Insurance Company',
            'type' => 'underwriter',
            'subscription_status' => 'active',
            'email' => 'underwriter@test.com',
            'phone' => '+0987654321',
        ]);

        // Create users
        $this->user1 = User::create([
            'name' => 'John Doe',
            'email' => 'john@test.com',
            'email_verified_at' => now(),
            'password' => bcrypt('password'),
            'tenant_id' => $this->tenant1->id,
        ]);

        $this->user2 = User::create([
            'name' => 'Jane Smith',
            'email' => 'jane@test.com',
            'email_verified_at' => now(),
            'password' => bcrypt('password'),
            'tenant_id' => $this->tenant2->id,
        ]);

        // Create customers
        $this->customer1 = Customer::create([
            'tenant_id' => $this->tenant1->id,
            'type' => 'individual',
            'first_name' => 'Alice',
            'last_name' => 'Johnson',
            'email' => 'alice@test.com',
            'phone' => '+1111111111',
            'is_active' => true,
        ]);

        $this->customer2 = Customer::create([
            'tenant_id' => $this->tenant2->id,
            'type' => 'corporate',
            'company_name' => 'Test Corp',
            'email' => 'testcorp@test.com',
            'phone' => '+2222222222',
            'is_active' => true,
        ]);

        // Create insurance product
        $this->product = InsuranceProduct::create([
            'name' => 'Comprehensive Auto Insurance',
            'type' => 'auto',
            'description' => 'Full coverage auto insurance',
            'base_premium' => 50000,
            'is_active' => true,
            'form_fields' => [
                [
                    'key' => 'vehicle_year',
                    'label' => 'Vehicle Year',
                    'type' => 'number',
                    'required' => true,
                ],
                [
                    'key' => 'driver_experience',
                    'label' => 'Driver Experience (Years)',
                    'type' => 'number',
                    'required' => true,
                ],
            ],
        ]);
    }

    private function setupPermissions(): void
    {
        // Create permissions
        $permissions = [
            'view quotes',
            'create quotes',
            'edit quotes',
            'delete quotes',
            'approve quotes',
            'create policies',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Create roles and assign permissions
        $staffRole = Role::create(['name' => 'staff']);
        $staffRole->givePermissionTo($permissions);

        $this->user1->assignRole($staffRole);
        $this->user2->assignRole($staffRole);
    }

    /** @test */
    public function it_can_list_quotes_for_authenticated_tenant()
    {
        // Create quotes for both tenants
        $quote1 = Quote::create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400001',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Comprehensive', 'amount' => 1000000]],
            'premium_amount' => 75000,
            'commission_amount' => 7500,
            'total_amount' => 82500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user1->id,
        ]);

        $quote2 = Quote::create([
            'tenant_id' => $this->tenant2->id,
            'customer_id' => $this->customer2->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400002',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Third Party', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user2->id,
        ]);

        // Test user1 can only see quotes from tenant1
        $response = $this->actingAs($this->user1)
            ->get(route('quotes.index'));

        $response->assertStatus(Response::HTTP_OK);
        $response->assertInertia(fn ($page) => $page->component('quotes/index')
            ->has('quotes.data', 1)
            ->where('quotes.data.0.id', $quote1->id)
        );

        // Test user2 can only see quotes from tenant2
        $response = $this->actingAs($this->user2)
            ->get(route('quotes.index'));

        $response->assertStatus(Response::HTTP_OK);
        $response->assertInertia(fn ($page) => $page->component('quotes/index')
            ->has('quotes.data', 1)
            ->where('quotes.data.0.id', $quote2->id)
        );
    }

    /** @test */
    public function it_can_create_a_quote()
    {
        $quoteData = [
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'coverage_details' => [
                ['type' => 'Comprehensive', 'amount' => 1500000, 'description' => 'Full coverage'],
            ],
            'valid_until' => now()->addDays(30)->format('Y-m-d'),
            'notes' => 'Test quote notes',
            'form_data' => [
                'vehicle_year' => 2020,
                'driver_experience' => 5,
            ],
        ];

        $response = $this->actingAs($this->user1)
            ->post(route('quotes.store'), $quoteData);

        $response->assertRedirect();

        $this->assertDatabaseHas('quotes', [
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'status' => 'draft',
            'notes' => 'Test quote notes',
            'created_by' => $this->user1->id,
        ]);

        $quote = Quote::where('tenant_id', $this->tenant1->id)
            ->where('customer_id', $this->customer1->id)
            ->first();

        $this->assertNotNull($quote);
        $this->assertEquals('Comprehensive', $quote->coverage_details[0]['type']);
        $this->assertEquals(5, $quote->form_data['driver_experience']);
        $this->assertGreaterThan(0, $quote->premium_amount);
    }

    /** @test */
    public function it_cannot_create_quote_for_customer_from_different_tenant()
    {
        $quoteData = [
            'customer_id' => $this->customer2->id, // Different tenant's customer
            'insurance_product_id' => $this->product->id,
            'coverage_details' => [
                ['type' => 'Basic', 'amount' => 500000],
            ],
            'valid_until' => now()->addDays(30)->format('Y-m-d'),
        ];

        $response = $this->actingAs($this->user1)
            ->post(route('quotes.store'), $quoteData);

        $response->assertSessionHasErrors(['customer_id']);
    }

    /** @test */
    public function it_can_view_a_quote()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400003',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Comprehensive', 'amount' => 1000000]],
            'premium_amount' => 75000,
            'commission_amount' => 7500,
            'total_amount' => 82500,
            'valid_until' => now()->addDays(30),
            'form_data' => ['vehicle_year' => 2021],
            'notes' => 'Quote for Alice Johnson',
            'created_by' => $this->user1->id,
        ]);

        $response = $this->actingAs($this->user1)
            ->get(route('quotes.show', $quote));

        $response->assertStatus(Response::HTTP_OK);
        $response->assertInertia(fn ($page) => $page->component('quotes/show')
            ->where('quote.id', $quote->id)
            ->where('quote.quote_number', 'QT202400003')
            ->where('quote.status', 'sent')
            ->has('canEdit')
            ->has('canSend')
        );
    }

    /** @test */
    public function it_cannot_view_quote_from_different_tenant()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant2->id,
            'customer_id' => $this->customer2->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400004',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user2->id,
        ]);

        $response = $this->actingAs($this->user1)
            ->get(route('quotes.show', $quote));

        $response->assertStatus(Response::HTTP_FORBIDDEN);
    }

    /** @test */
    public function it_can_update_a_quote()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400005',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user1->id,
        ]);

        $updateData = [
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'coverage_details' => [
                ['type' => 'Comprehensive', 'amount' => 1000000, 'description' => 'Updated coverage'],
            ],
            'valid_until' => now()->addDays(45)->format('Y-m-d'),
            'notes' => 'Updated quote notes',
            'internal_notes' => 'Internal note for staff',
        ];

        $response = $this->actingAs($this->user1)
            ->put(route('quotes.update', $quote), $updateData);

        $response->assertRedirect(route('quotes.show', $quote));

        $quote->refresh();
        $this->assertEquals('Comprehensive', $quote->coverage_details[0]['type']);
        $this->assertEquals(1000000, $quote->coverage_details[0]['amount']);
        $this->assertEquals('Updated quote notes', $quote->notes);
        $this->assertEquals('Internal note for staff', $quote->internal_notes);
        $this->assertGreaterThan(35000, $quote->premium_amount); // Should recalculate
    }

    /** @test */
    public function it_cannot_update_quote_from_different_tenant()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant2->id,
            'customer_id' => $this->customer2->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400006',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user2->id,
        ]);

        $updateData = [
            'notes' => 'Attempt to update from different tenant',
        ];

        $response = $this->actingAs($this->user1)
            ->put(route('quotes.update', $quote), $updateData);

        $response->assertStatus(Response::HTTP_FORBIDDEN);
    }

    /** @test */
    public function it_can_delete_a_draft_quote()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400007',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user1->id,
        ]);

        $response = $this->actingAs($this->user1)
            ->delete(route('quotes.destroy', $quote));

        $response->assertRedirect(route('quotes.index'));
        $this->assertSoftDeleted('quotes', ['id' => $quote->id]);
    }

    /** @test */
    public function it_cannot_delete_accepted_quote()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400008',
            'status' => 'accepted',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'accepted_at' => now(),
            'created_by' => $this->user1->id,
        ]);

        $response = $this->actingAs($this->user1)
            ->delete(route('quotes.destroy', $quote));

        $response->assertStatus(Response::HTTP_INTERNAL_SERVER_ERROR);
        $this->assertDatabaseHas('quotes', ['id' => $quote->id, 'deleted_at' => null]);
    }

    /** @test */
    public function it_can_send_a_quote()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400009',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user1->id,
        ]);

        $response = $this->actingAs($this->user1)
            ->post(route('quotes.send', $quote));

        $response->assertRedirect();

        $quote->refresh();
        $this->assertEquals('sent', $quote->status);
        $this->assertNotNull($quote->sent_at);
    }

    /** @test */
    public function it_can_accept_a_sent_quote()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400010',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'sent_at' => now(),
            'created_by' => $this->user1->id,
        ]);

        $response = $this->actingAs($this->user1)
            ->post(route('quotes.accept', $quote), [
                'reason' => 'Customer agreed to terms',
            ]);

        $response->assertRedirect();

        $quote->refresh();
        $this->assertEquals('accepted', $quote->status);
        $this->assertNotNull($quote->accepted_at);
    }

    /** @test */
    public function it_can_reject_a_sent_quote()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400011',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'sent_at' => now(),
            'created_by' => $this->user1->id,
        ]);

        $response = $this->actingAs($this->user1)
            ->post(route('quotes.reject', $quote), [
                'reason' => 'Premium too high',
            ]);

        $response->assertRedirect();

        $quote->refresh();
        $this->assertEquals('rejected', $quote->status);
        $this->assertNotNull($quote->rejected_at);
    }

    /** @test */
    public function it_can_duplicate_a_quote()
    {
        $originalQuote = Quote::create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400012',
            'status' => 'accepted',
            'coverage_details' => [['type' => 'Comprehensive', 'amount' => 1000000]],
            'premium_amount' => 75000,
            'commission_amount' => 7500,
            'total_amount' => 82500,
            'valid_until' => now()->addDays(30),
            'form_data' => ['vehicle_year' => 2020],
            'notes' => 'Original quote notes',
            'created_by' => $this->user1->id,
        ]);

        $response = $this->actingAs($this->user1)
            ->post(route('quotes.duplicate', $originalQuote));

        $response->assertRedirect();

        // Check that a new quote was created
        $duplicatedQuote = Quote::where('tenant_id', $this->tenant1->id)
            ->where('id', '!=', $originalQuote->id)
            ->first();

        $this->assertNotNull($duplicatedQuote);
        $this->assertEquals('draft', $duplicatedQuote->status);
        $this->assertEquals($originalQuote->customer_id, $duplicatedQuote->customer_id);
        $this->assertEquals($originalQuote->insurance_product_id, $duplicatedQuote->insurance_product_id);
        $this->assertEquals($originalQuote->coverage_details, $duplicatedQuote->coverage_details);
        $this->assertEquals($originalQuote->form_data, $duplicatedQuote->form_data);
        $this->assertNotEquals($originalQuote->quote_number, $duplicatedQuote->quote_number);
    }

    /** @test */
    public function it_can_extend_quote_validity()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400013',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(5), // Expiring soon
            'sent_at' => now(),
            'created_by' => $this->user1->id,
        ]);

        $originalValidUntil = $quote->valid_until;

        $response = $this->actingAs($this->user1)
            ->post(route('quotes.extend-validity', $quote), [
                'days' => 15,
            ]);

        $response->assertRedirect();

        $quote->refresh();
        $this->assertTrue($quote->valid_until->gt($originalValidUntil));
        $this->assertEquals(
            $originalValidUntil->addDays(15)->format('Y-m-d'),
            $quote->valid_until->format('Y-m-d')
        );
    }

    /** @test */
    public function it_applies_tenant_scope_automatically()
    {
        // Create quotes for both tenants
        $quote1 = Quote::create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400014',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user1->id,
        ]);

        $quote2 = Quote::create([
            'tenant_id' => $this->tenant2->id,
            'customer_id' => $this->customer2->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400015',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user2->id,
        ]);

        // When acting as user1, should only see tenant1 quotes
        $this->actingAs($this->user1);
        app()->instance('tenant', $this->tenant1);

        $quotes = Quote::all();
        $this->assertCount(1, $quotes);
        $this->assertEquals($quote1->id, $quotes->first()->id);

        // When acting as user2, should only see tenant2 quotes
        $this->actingAs($this->user2);
        app()->instance('tenant', $this->tenant2);

        $quotes = Quote::all();
        $this->assertCount(1, $quotes);
        $this->assertEquals($quote2->id, $quotes->first()->id);
    }

    /** @test */
    public function it_validates_quote_data_correctly()
    {
        $invalidData = [
            'customer_id' => null,
            'insurance_product_id' => null,
            'coverage_details' => [],
            'valid_until' => 'invalid-date',
            'premium_amount' => -100, // Negative amount
        ];

        $response = $this->actingAs($this->user1)
            ->post(route('quotes.store'), $invalidData);

        $response->assertSessionHasErrors([
            'customer_id',
            'insurance_product_id',
            'coverage_details',
            'valid_until',
        ]);
    }

    /** @test */
    public function it_calculates_premium_correctly()
    {
        $quoteData = [
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'coverage_details' => [
                ['type' => 'Comprehensive', 'amount' => 1000000],
            ],
            'valid_until' => now()->addDays(30)->format('Y-m-d'),
            'form_data' => [
                'vehicle_year' => 2020,
                'driver_experience' => 10,
            ],
        ];

        $response = $this->actingAs($this->user1)
            ->post(route('quotes.store'), $quoteData);

        $response->assertRedirect();

        $quote = Quote::where('tenant_id', $this->tenant1->id)
            ->where('customer_id', $this->customer1->id)
            ->first();

        $this->assertNotNull($quote);
        $this->assertGreaterThan(0, $quote->premium_amount);
        $this->assertGreaterThan(0, $quote->commission_amount);
        $this->assertEquals(
            $quote->premium_amount + $quote->commission_amount,
            $quote->total_amount
        );
    }

    /** @test */
    public function it_generates_unique_quote_numbers()
    {
        $quoteData = [
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'coverage_details' => [
                ['type' => 'Basic', 'amount' => 500000],
            ],
            'valid_until' => now()->addDays(30)->format('Y-m-d'),
        ];

        // Create first quote
        $response1 = $this->actingAs($this->user1)
            ->post(route('quotes.store'), $quoteData);

        $response1->assertRedirect();

        // Create second quote
        $response2 = $this->actingAs($this->user1)
            ->post(route('quotes.store'), $quoteData);

        $response2->assertRedirect();

        $quotes = Quote::where('tenant_id', $this->tenant1->id)->get();
        $this->assertCount(2, $quotes);
        $this->assertNotEquals($quotes[0]->quote_number, $quotes[1]->quote_number);
    }

    /** @test */
    public function quote_automatically_expires()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400016',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->subDay(), // Already expired
            'sent_at' => now()->subDays(2),
            'created_by' => $this->user1->id,
        ]);

        // Update the quote to trigger the model event
        $quote->notes = 'Updated notes';
        $quote->save();

        $quote->refresh();
        $this->assertEquals('expired', $quote->status);
        $this->assertNotNull($quote->expired_at);
    }

    /** @test */
    public function it_filters_quotes_by_search_term()
    {
        $quote1 = Quote::create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400017',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user1->id,
        ]);

        $customer2 = Customer::create([
            'tenant_id' => $this->tenant1->id,
            'type' => 'individual',
            'first_name' => 'Bob',
            'last_name' => 'Wilson',
            'email' => 'bob@test.com',
            'phone' => '+3333333333',
            'is_active' => true,
        ]);

        $quote2 = Quote::create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $customer2->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400018',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Comprehensive', 'amount' => 1000000]],
            'premium_amount' => 75000,
            'commission_amount' => 7500,
            'total_amount' => 82500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user1->id,
        ]);

        // Search by customer name
        $response = $this->actingAs($this->user1)
            ->get(route('quotes.index', ['search' => 'Alice']));

        $response->assertStatus(Response::HTTP_OK);
        $response->assertInertia(fn ($page) => $page->has('quotes.data', 1)
            ->where('quotes.data.0.id', $quote1->id)
        );

        // Search by quote number
        $response = $this->actingAs($this->user1)
            ->get(route('quotes.index', ['search' => 'QT202400018']));

        $response->assertStatus(Response::HTTP_OK);
        $response->assertInertia(fn ($page) => $page->has('quotes.data', 1)
            ->where('quotes.data.0.id', $quote2->id)
        );
    }

    /** @test */
    public function it_filters_quotes_by_status()
    {
        $draftQuote = Quote::create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400019',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user1->id,
        ]);

        $sentQuote = Quote::create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400020',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Comprehensive', 'amount' => 1000000]],
            'premium_amount' => 75000,
            'commission_amount' => 7500,
            'total_amount' => 82500,
            'valid_until' => now()->addDays(30),
            'sent_at' => now(),
            'created_by' => $this->user1->id,
        ]);

        // Filter by draft status
        $response = $this->actingAs($this->user1)
            ->get(route('quotes.index', ['status' => 'draft']));

        $response->assertStatus(Response::HTTP_OK);
        $response->assertInertia(fn ($page) => $page->has('quotes.data', 1)
            ->where('quotes.data.0.id', $draftQuote->id)
        );

        // Filter by sent status
        $response = $this->actingAs($this->user1)
            ->get(route('quotes.index', ['status' => 'sent']));

        $response->assertStatus(Response::HTTP_OK);
        $response->assertInertia(fn ($page) => $page->has('quotes.data', 1)
            ->where('quotes.data.0.id', $sentQuote->id)
        );
    }
}
