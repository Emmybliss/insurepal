<?php

use App\Models\Customer;
use App\Models\Policy;
use App\Models\PolicyAmendment;
use App\Models\PolicyProduct;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Create a tenant
    $this->tenant = Tenant::factory()->create([
        'type' => 'underwriter',
        'name' => 'Test Insurance Company',
    ]);

    // Create user
    $this->user = User::factory()->create([
        'tenant_id' => $this->tenant->id,
        'email' => 'underwriter@test.com',
    ]);

    // Assign underwriter role
    $this->user->assignRole('underwriter');

    // Create customer
    $this->customer = Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'individual',
    ]);

    // Create policy product
    $this->policyProduct = PolicyProduct::factory()->create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Test Auto Insurance',
    ]);

    // Create active policy
    $this->policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'policy_product_id' => $this->policyProduct->id,
        'status' => 'active',
        'premium_amount' => 300000,
        'total_amount' => 350000,
        'effective_date' => now()->format('Y-m-d'),
        'expiry_date' => now()->addYear()->format('Y-m-d'),
        'payment_frequency' => 'annual',
        'coverage_details' => json_encode([
            'sum_assured' => 500000,
            'coverage_type' => 'comprehensive',
        ]),
    ]);
});

it('can access amendment form for active policy', function () {
    $response = $this->actingAs($this->user)
        ->get(route('policy-management.amend', $this->policy));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('policies/AmendForm')
        ->has('policy')
        ->where('policy.id', $this->policy->id)
        ->where('policy.status', 'active')
    );
});

it('can create coverage change amendment', function () {
    $amendmentData = [
        'amendment_type' => 'coverage_change',
        'amendment_reason' => 'Customer requested increased coverage',
        'effective_date' => now()->addDays(7)->format('Y-m-d'),
        'coverage_details' => [
            'sum_assured' => 750000,
            'coverage_type' => 'comprehensive',
        ],
        'customer_notes' => 'Upgrade to higher coverage limit',
    ];

    $response = $this->actingAs($this->user)
        ->post(route('policy-management.amend.store', $this->policy), $amendmentData);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    // Check amendment was created
    $this->assertDatabaseHas('policy_amendments', [
        'policy_id' => $this->policy->id,
        'amendment_type' => 'coverage_change',
        'amendment_reason' => 'Customer requested increased coverage',
        'status' => 'draft',
    ]);
});

it('can create premium adjustment amendment', function () {
    $amendmentData = [
        'amendment_type' => 'premium_adjustment',
        'amendment_reason' => 'Risk assessment update',
        'effective_date' => now()->addDays(30)->format('Y-m-d'),
        'new_premium_amount' => '350000',
        'customer_notes' => 'Premium adjusted based on updated risk profile',
    ];

    $response = $this->actingAs($this->user)
        ->post(route('policy-management.amend.store', $this->policy), $amendmentData);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    // Check amendment was created with correct details
    $amendment = PolicyAmendment::where('policy_id', $this->policy->id)->first();
    expect($amendment)->not->toBeNull();
    expect($amendment->amendment_type)->toBe('premium_adjustment');
    expect($amendment->amendment_data['new_premium_amount'])->toBe('350000');
});

it('can create term extension amendment', function () {
    $newExpiryDate = now()->addYears(2)->format('Y-m-d');

    $amendmentData = [
        'amendment_type' => 'term_extension',
        'amendment_reason' => 'Customer requested policy extension',
        'effective_date' => $this->policy->expiry_date,
        'new_expiry_date' => $newExpiryDate,
        'customer_notes' => 'Policy term extended by customer request',
    ];

    $response = $this->actingAs($this->user)
        ->post(route('policy-management.amend.store', $this->policy), $amendmentData);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $amendment = PolicyAmendment::where('policy_id', $this->policy->id)->first();
    expect($amendment->amendment_data['new_expiry_date'])->toBe($newExpiryDate);
});

it('validates required amendment fields', function () {
    $response = $this->actingAs($this->user)
        ->post(route('policy-management.amend.store', $this->policy), []);

    $response->assertSessionHasErrors([
        'amendment_type',
        'amendment_reason',
        'effective_date',
    ]);
});

it('validates amendment type selection', function () {
    $amendmentData = [
        'amendment_type' => 'invalid_type',
        'amendment_reason' => 'Test reason',
        'effective_date' => now()->addDays(7)->format('Y-m-d'),
    ];

    $response = $this->actingAs($this->user)
        ->post(route('policy-management.amend.store', $this->policy), $amendmentData);

    $response->assertSessionHasErrors(['amendment_type']);
});

it('prevents amendments on non-active policies', function () {
    // Create a draft policy
    $draftPolicy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'policy_product_id' => $this->policyProduct->id,
        'status' => 'draft',
    ]);

    $response = $this->actingAs($this->user)
        ->get(route('policy-management.amend', $draftPolicy));

    $response->assertForbidden();
});

it('enforces tenant isolation for amendments', function () {
    // Create another tenant and policy
    $otherTenant = Tenant::factory()->create(['type' => 'underwriter']);
    $otherPolicy = Policy::factory()->create([
        'tenant_id' => $otherTenant->id,
        'status' => 'active',
    ]);

    $response = $this->actingAs($this->user)
        ->get(route('policy-management.amend', $otherPolicy));

    $response->assertForbidden();
});

it('calculates premium adjustment correctly', function () {
    $originalPremium = $this->policy->premium_amount; // 300000
    $newPremium = 400000;
    $expectedAdjustment = $newPremium - $originalPremium; // 100000

    $amendmentData = [
        'amendment_type' => 'premium_adjustment',
        'amendment_reason' => 'Risk increase',
        'effective_date' => now()->addDays(30)->format('Y-m-d'),
        'new_premium_amount' => (string) $newPremium,
    ];

    $response = $this->actingAs($this->user)
        ->post(route('policy-management.amend.store', $this->policy), $amendmentData);

    $response->assertRedirect();

    $amendment = PolicyAmendment::where('policy_id', $this->policy->id)->first();
    expect($amendment->amendment_data['premium_adjustment'])->toBe($expectedAdjustment);
});

it('can submit amendment for approval', function () {
    // First create an amendment
    $amendment = PolicyAmendment::factory()->create([
        'policy_id' => $this->policy->id,
        'tenant_id' => $this->tenant->id,
        'status' => 'draft',
        'amendment_type' => 'coverage_change',
    ]);

    $response = $this->actingAs($this->user)
        ->post(route('policy-amendments.submit'), [
            'amendment_id' => $amendment->id,
            'notes' => 'Please review this amendment',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    // Check amendment status updated
    $amendment->refresh();
    expect($amendment->status)->toBe('pending_approval');
});

it('tracks amendment history properly', function () {
    // Create multiple amendments for the same policy
    $amendment1 = PolicyAmendment::factory()->create([
        'policy_id' => $this->policy->id,
        'tenant_id' => $this->tenant->id,
        'amendment_type' => 'coverage_change',
        'status' => 'active',
        'created_at' => now()->subDays(30),
    ]);

    $amendment2 = PolicyAmendment::factory()->create([
        'policy_id' => $this->policy->id,
        'tenant_id' => $this->tenant->id,
        'amendment_type' => 'premium_adjustment',
        'status' => 'pending_approval',
        'created_at' => now()->subDays(15),
    ]);

    // Access policy show page which should display amendments
    $response = $this->actingAs($this->user)
        ->get(route('policy-management.show', $this->policy));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('policy.amendments', 2)
        ->where('policy.amendments.0.amendment_type', 'premium_adjustment') // Most recent first
        ->where('policy.amendments.1.amendment_type', 'coverage_change')
    );
});
