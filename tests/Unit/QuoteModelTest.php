<?php

namespace Tests\Unit;

use App\Models\Customer;
use App\Models\InsuranceProduct;
use App\Models\Quote;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuoteModelTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private Customer $customer;

    private InsuranceProduct $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setupTestData();
    }

    private function setupTestData(): void
    {
        $this->tenant = Tenant::create([
            'name' => 'Test Tenant',
            'type' => 'broker',
            'subscription_status' => 'active',
            'email' => 'test@example.com',
            'phone' => '+1234567890',
        ]);

        $this->user = User::create([
            'name' => 'Test User',
            'email' => 'user@test.com',
            'email_verified_at' => now(),
            'password' => bcrypt('password'),
            'tenant_id' => $this->tenant->id,
        ]);

        $this->customer = Customer::create([
            'tenant_id' => $this->tenant->id,
            'type' => 'individual',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@test.com',
            'phone' => '+1111111111',
            'is_active' => true,
        ]);

        $this->product = InsuranceProduct::create([
            'name' => 'Test Insurance',
            'type' => 'auto',
            'description' => 'Test insurance product',
            'base_premium' => 50000,
            'is_active' => true,
        ]);
    }

    /** @test */
    public function it_belongs_to_a_tenant()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400001',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user->id,
        ]);

        $this->assertInstanceOf(Tenant::class, $quote->tenant);
        $this->assertEquals($this->tenant->id, $quote->tenant->id);
    }

    /** @test */
    public function it_belongs_to_a_customer()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400002',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user->id,
        ]);

        $this->assertInstanceOf(Customer::class, $quote->customer);
        $this->assertEquals($this->customer->id, $quote->customer->id);
    }

    /** @test */
    public function it_belongs_to_an_insurance_product()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400003',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user->id,
        ]);

        $this->assertInstanceOf(InsuranceProduct::class, $quote->insuranceProduct);
        $this->assertEquals($this->product->id, $quote->insuranceProduct->id);
    }

    /** @test */
    public function it_belongs_to_a_user_who_created_it()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400004',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user->id,
        ]);

        $this->assertInstanceOf(User::class, $quote->createdBy);
        $this->assertEquals($this->user->id, $quote->createdBy->id);
    }

    /** @test */
    public function it_automatically_generates_quote_number_on_creation()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user->id,
        ]);

        $this->assertNotNull($quote->quote_number);
        $this->assertStringStartsWith('QT'.now()->year, $quote->quote_number);
    }

    /** @test */
    public function it_automatically_sets_default_valid_until_date()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400005',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'created_by' => $this->user->id,
        ]);

        $this->assertNotNull($quote->valid_until);
        $this->assertTrue($quote->valid_until->isFuture());
        $this->assertTrue($quote->valid_until->diffInDays(now()) >= 29);
    }

    /** @test */
    public function it_automatically_sets_created_by_if_not_provided()
    {
        // Set authenticated user for testing
        $this->actingAs($this->user);

        $quote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400006',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
        ]);

        $this->assertEquals($this->user->id, $quote->created_by);
    }

    /** @test */
    public function it_casts_coverage_details_and_form_data_to_arrays()
    {
        $coverageDetails = [['type' => 'Comprehensive', 'amount' => 1000000]];
        $formData = ['vehicle_year' => 2020, 'driver_experience' => 5];

        $quote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400007',
            'status' => 'draft',
            'coverage_details' => $coverageDetails,
            'form_data' => $formData,
            'premium_amount' => 75000,
            'commission_amount' => 7500,
            'total_amount' => 82500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user->id,
        ]);

        $this->assertIsArray($quote->coverage_details);
        $this->assertIsArray($quote->form_data);
        $this->assertEquals($coverageDetails, $quote->coverage_details);
        $this->assertEquals($formData, $quote->form_data);
    }

    /** @test */
    public function it_formats_premium_amounts_correctly()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400008',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 75000.50,
            'commission_amount' => 7500.25,
            'total_amount' => 82500.75,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user->id,
        ]);

        $this->assertEquals('₦75,000.50', $quote->formatted_premium_amount);
        $this->assertEquals('₦82,500.75', $quote->formatted_total_amount);
    }

    /** @test */
    public function it_determines_if_quote_is_expired()
    {
        // Not expired quote
        $activeQuote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400009',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user->id,
        ]);

        // Expired quote
        $expiredQuote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400010',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->subDay(),
            'created_by' => $this->user->id,
        ]);

        // Accepted quote (should not be considered expired even if past valid_until)
        $acceptedQuote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400011',
            'status' => 'accepted',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->subDay(),
            'accepted_at' => now(),
            'created_by' => $this->user->id,
        ]);

        $this->assertFalse($activeQuote->is_expired);
        $this->assertTrue($expiredQuote->is_expired);
        $this->assertFalse($acceptedQuote->is_expired);
    }

    /** @test */
    public function it_provides_status_colors()
    {
        $statusColors = [
            'draft' => 'gray',
            'sent' => 'blue',
            'accepted' => 'green',
            'rejected' => 'red',
            'expired' => 'orange',
        ];

        foreach ($statusColors as $status => $expectedColor) {
            $quote = Quote::create([
                'tenant_id' => $this->tenant->id,
                'customer_id' => $this->customer->id,
                'insurance_product_id' => $this->product->id,
                'quote_number' => "QT20240001{$status}",
                'status' => $status,
                'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
                'premium_amount' => 35000,
                'commission_amount' => 3500,
                'total_amount' => 38500,
                'valid_until' => now()->addDays(30),
                'created_by' => $this->user->id,
            ]);

            $this->assertEquals($expectedColor, $quote->status_color);
        }
    }

    /** @test */
    public function it_provides_customer_name()
    {
        // Individual customer
        $individualCustomer = Customer::create([
            'tenant_id' => $this->tenant->id,
            'type' => 'individual',
            'first_name' => 'Alice',
            'last_name' => 'Johnson',
            'email' => 'alice@test.com',
            'phone' => '+2222222222',
            'is_active' => true,
        ]);

        $quote1 = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $individualCustomer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400012',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user->id,
        ]);

        // Corporate customer
        $corporateCustomer = Customer::create([
            'tenant_id' => $this->tenant->id,
            'type' => 'corporate',
            'company_name' => 'Test Corporation',
            'email' => 'corp@test.com',
            'phone' => '+3333333333',
            'is_active' => true,
        ]);

        $quote2 = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $corporateCustomer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400013',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user->id,
        ]);

        $this->assertEquals('Alice Johnson', $quote1->customer_name);
        $this->assertEquals('Test Corporation', $quote2->customer_name);
    }

    /** @test */
    public function it_can_check_if_quote_can_be_edited()
    {
        $draftQuote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400014',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user->id,
        ]);

        $sentQuote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400015',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'sent_at' => now(),
            'created_by' => $this->user->id,
        ]);

        $acceptedQuote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400016',
            'status' => 'accepted',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'accepted_at' => now(),
            'created_by' => $this->user->id,
        ]);

        $this->assertTrue($draftQuote->canEdit());
        $this->assertTrue($sentQuote->canEdit());
        $this->assertFalse($acceptedQuote->canEdit());
    }

    /** @test */
    public function it_can_check_if_quote_can_be_sent()
    {
        $draftQuote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400017',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user->id,
        ]);

        $sentQuote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400018',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'sent_at' => now(),
            'created_by' => $this->user->id,
        ]);

        $this->assertTrue($draftQuote->canSend());
        $this->assertFalse($sentQuote->canSend());
    }

    /** @test */
    public function it_can_check_if_quote_can_be_accepted_or_rejected()
    {
        $sentQuote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400019',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'sent_at' => now(),
            'created_by' => $this->user->id,
        ]);

        $expiredQuote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400020',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->subDay(),
            'sent_at' => now()->subDays(2),
            'created_by' => $this->user->id,
        ]);

        $draftQuote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400021',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user->id,
        ]);

        $this->assertTrue($sentQuote->canAccept());
        $this->assertTrue($sentQuote->canReject());
        $this->assertFalse($expiredQuote->canAccept());
        $this->assertFalse($expiredQuote->canReject());
        $this->assertFalse($draftQuote->canAccept());
        $this->assertFalse($draftQuote->canReject());
    }

    /** @test */
    public function it_can_mark_quote_as_sent()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400022',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user->id,
        ]);

        $quote->markAsSent();

        $this->assertEquals('sent', $quote->status);
        $this->assertNotNull($quote->sent_at);
        $this->assertTrue($quote->sent_at->isToday());
    }

    /** @test */
    public function it_can_mark_quote_as_accepted()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400023',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'sent_at' => now(),
            'created_by' => $this->user->id,
        ]);

        $reason = 'Customer accepted all terms';
        $quote->markAsAccepted($reason);

        $this->assertEquals('accepted', $quote->status);
        $this->assertNotNull($quote->accepted_at);
        $this->assertTrue($quote->accepted_at->isToday());
    }

    /** @test */
    public function it_can_mark_quote_as_rejected()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400024',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'sent_at' => now(),
            'created_by' => $this->user->id,
        ]);

        $reason = 'Premium too high';
        $quote->markAsRejected($reason);

        $this->assertEquals('rejected', $quote->status);
        $this->assertNotNull($quote->rejected_at);
        $this->assertTrue($quote->rejected_at->isToday());
    }

    /** @test */
    public function it_can_extend_validity()
    {
        $quote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400025',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(5),
            'sent_at' => now(),
            'created_by' => $this->user->id,
        ]);

        $originalValidUntil = $quote->valid_until;
        $quote->extendValidity(15);

        $this->assertTrue($quote->valid_until->gt($originalValidUntil));
        $this->assertEquals(15, $quote->valid_until->diffInDays($originalValidUntil));
    }

    /** @test */
    public function it_can_duplicate_quote()
    {
        $originalQuote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400026',
            'status' => 'accepted',
            'coverage_details' => [['type' => 'Comprehensive', 'amount' => 1000000]],
            'premium_amount' => 75000,
            'commission_amount' => 7500,
            'total_amount' => 82500,
            'valid_until' => now()->addDays(30),
            'form_data' => ['vehicle_year' => 2020],
            'notes' => 'Original quote notes',
            'accepted_at' => now(),
            'created_by' => $this->user->id,
        ]);

        $this->actingAs($this->user);
        $duplicatedQuote = $originalQuote->duplicate();

        $this->assertNotEquals($originalQuote->id, $duplicatedQuote->id);
        $this->assertNotEquals($originalQuote->quote_number, $duplicatedQuote->quote_number);
        $this->assertEquals('draft', $duplicatedQuote->status);
        $this->assertEquals($originalQuote->customer_id, $duplicatedQuote->customer_id);
        $this->assertEquals($originalQuote->insurance_product_id, $duplicatedQuote->insurance_product_id);
        $this->assertEquals($originalQuote->coverage_details, $duplicatedQuote->coverage_details);
        $this->assertEquals($originalQuote->form_data, $duplicatedQuote->form_data);
        $this->assertNull($duplicatedQuote->sent_at);
        $this->assertNull($duplicatedQuote->accepted_at);
        $this->assertTrue($duplicatedQuote->valid_until->isFuture());
    }

    /** @test */
    public function it_has_proper_scopes()
    {
        // Create quotes with different statuses
        $activeQuote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400027',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'sent_at' => now(),
            'created_by' => $this->user->id,
        ]);

        $acceptedQuote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400028',
            'status' => 'accepted',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'accepted_at' => now(),
            'created_by' => $this->user->id,
        ]);

        $expiredQuote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400029',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->subDay(),
            'sent_at' => now()->subDays(2),
            'created_by' => $this->user->id,
        ]);

        $expiringQuote = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400030',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(3),
            'sent_at' => now(),
            'created_by' => $this->user->id,
        ]);

        // Test scopes
        $activeQuotes = Quote::active()->get();
        $this->assertCount(2, $activeQuotes);
        $this->assertTrue($activeQuotes->contains($activeQuote));
        $this->assertTrue($activeQuotes->contains($acceptedQuote));

        $expiredQuotes = Quote::expired()->get();
        $this->assertCount(1, $expiredQuotes);
        $this->assertTrue($expiredQuotes->contains($expiredQuote));

        $expiringQuotes = Quote::expiringWithin(7)->get();
        $this->assertCount(1, $expiringQuotes);
        $this->assertTrue($expiringQuotes->contains($expiringQuote));

        $sentQuotes = Quote::byStatus('sent')->get();
        $this->assertCount(3, $sentQuotes);

        $customerQuotes = Quote::byCustomer($this->customer->id)->get();
        $this->assertCount(4, $customerQuotes);

        $productQuotes = Quote::byProduct($this->product->id)->get();
        $this->assertCount(4, $productQuotes);
    }

    /** @test */
    public function it_has_proper_search_scope()
    {
        $quote1 = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400031',
            'status' => 'draft',
            'coverage_details' => [['type' => 'Basic', 'amount' => 500000]],
            'premium_amount' => 35000,
            'commission_amount' => 3500,
            'total_amount' => 38500,
            'valid_until' => now()->addDays(30),
            'created_by' => $this->user->id,
        ]);

        $differentCustomer = Customer::create([
            'tenant_id' => $this->tenant->id,
            'type' => 'individual',
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane@test.com',
            'phone' => '+4444444444',
            'is_active' => true,
        ]);

        $quote2 = Quote::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $differentCustomer->id,
            'insurance_product_id' => $this->product->id,
            'quote_number' => 'QT202400032',
            'status' => 'sent',
            'coverage_details' => [['type' => 'Comprehensive', 'amount' => 1000000]],
            'premium_amount' => 75000,
            'commission_amount' => 7500,
            'total_amount' => 82500,
            'valid_until' => now()->addDays(30),
            'sent_at' => now(),
            'created_by' => $this->user->id,
        ]);

        // Search by customer name
        $searchResults = Quote::search('John')->get();
        $this->assertCount(1, $searchResults);
        $this->assertTrue($searchResults->contains($quote1));

        // Search by quote number
        $searchResults = Quote::search('QT202400032')->get();
        $this->assertCount(1, $searchResults);
        $this->assertTrue($searchResults->contains($quote2));

        // Search by email
        $searchResults = Quote::search('jane@test.com')->get();
        $this->assertCount(1, $searchResults);
        $this->assertTrue($searchResults->contains($quote2));
    }
}
