<?php

use App\Enums\PlacementSource;
use App\Models\BrokerSlip;
use App\Models\InsuranceCompany;
use App\Models\PolicyProduct;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create(['type' => 'broker', 'status' => 'active']);

    $this->user = User::factory()->create([
        'tenant_id' => $this->tenant->id,
        'is_active' => true,
    ]);

    $role = Role::create(['name' => 'broker']);
    $this->user->assignRole($role);

    $this->customer = \App\Models\Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);

    $this->insuranceCompany = InsuranceCompany::factory()->create([
        'company_type' => 'underwriter',
        'is_active' => true,
    ]);

    $this->policyProduct = PolicyProduct::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);
});

it('renders the direct creation form', function () {
    $response = $this->actingAs($this->user)
        ->get(route('broker-slips.create-direct'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('broker-slips/CreateDirect')
        ->has('customers')
        ->has('insuranceCompanies')
        ->has('policyProducts')
        ->has('clauseLibrary')
        ->has('documentTemplates')
    );
});

it('can create a broker slip directly', function () {
    $payload = [
        'customer_id' => $this->customer->id,
        'policy_product_id' => $this->policyProduct->id,
        'policy_class_id' => $this->policyProduct->policy_class_id,
        'insurance_company_id' => $this->insuranceCompany->id,
        'currency' => 'NGN',
        'period_start' => '2026-07-01',
        'period_end' => '2027-06-30',
        'risk_details' => 'Comprehensive motor insurance for a 2020 Toyota Camry',
        'commission_rate' => 10,
        'fees' => 0,
        'tax_rate' => 0,
        'risks' => [
            [
                'item_type' => 'motor',
                'description' => '2020 Toyota Camry',
                'coverage_amount' => 1000000,
                'rate' => 5.5,
                'rate_basis' => 'percentage',
                'premium' => 55000,
            ],
        ],
    ];

    $response = $this->actingAs($this->user)
        ->post(route('broker-slips.store-direct'), $payload);

    $response->assertRedirect();

    $brokerSlip = BrokerSlip::first();
    expect($brokerSlip)->not->toBeNull();
    expect($brokerSlip->load('risks')->sum_insured)->toEqual(1000000.0);
    expect($brokerSlip->net_premium)->toEqual(49500.0);
    expect($brokerSlip->status)->toEqual('draft');

    $placement = $brokerSlip->placement;
    expect($placement)->not->toBeNull();
    expect($placement->customer_id)->toEqual($this->customer->id);
    expect($placement->policy_product_id)->toEqual($this->policyProduct->id);
    expect($placement->policy_class_id)->toEqual($this->policyProduct->policy_class_id);
    expect($placement->placement_source)->toEqual(PlacementSource::BrokerSlipDirect->value);
    expect($placement->is_system_generated)->toBeTrue();

    $market = $brokerSlip->placementMarket;
    expect($market)->not->toBeNull();
    expect($market->insurance_company_id)->toEqual($this->insuranceCompany->id);
});

it('validates required fields for direct creation', function () {
    $response = $this->actingAs($this->user)
        ->post(route('broker-slips.store-direct'), []);

    $response->assertSessionHasErrors([
        'customer_id',
        'policy_product_id',
        'insurance_company_id',
        'period_start',
        'period_end',
    ]);
});

it('creates a system-generated placement with correct source', function () {
    $payload = [
        'customer_id' => $this->customer->id,
        'policy_product_id' => $this->policyProduct->id,
        'insurance_company_id' => $this->insuranceCompany->id,
        'currency' => 'NGN',
        'period_start' => '2026-07-01',
        'period_end' => '2027-06-30',
        'risks' => [
            [
                'item_type' => 'property',
                'description' => 'Coverage',
                'coverage_amount' => 500000,
                'rate' => 3.0,
                'rate_basis' => 'percentage',
                'premium' => 15000,
                'net_premium' => 13500,
            ],
        ],
    ];

    $this->actingAs($this->user)
        ->post(route('broker-slips.store-direct'), $payload);

    $placement = \App\Models\Placement::first();
    expect($placement->placement_source)->toEqual(PlacementSource::BrokerSlipDirect->value);
    expect($placement->is_system_generated)->toBeTrue();
    expect($placement->status)->toEqual('draft');
});

it('creates a placement market for the selected insurer', function () {
    $payload = [
        'customer_id' => $this->customer->id,
        'policy_product_id' => $this->policyProduct->id,
        'insurance_company_id' => $this->insuranceCompany->id,
        'currency' => 'NGN',
        'period_start' => '2026-07-01',
        'period_end' => '2027-06-30',
        'risks' => [
            [
                'item_type' => 'property',
                'description' => 'Coverage',
                'coverage_amount' => 500000,
                'premium' => 15000,
                'net_premium' => 13500,
            ],
        ],
    ];

    $this->actingAs($this->user)
        ->post(route('broker-slips.store-direct'), $payload);

    $market = \App\Models\PlacementMarket::first();
    expect($market)->not->toBeNull();
    expect($market->insurance_company_id)->toEqual($this->insuranceCompany->id);
    expect($market->status)->toEqual('pending');
});

it('can create direct slip with items and clauses', function () {
    $payload = [
        'customer_id' => $this->customer->id,
        'policy_product_id' => $this->policyProduct->id,
        'insurance_company_id' => $this->insuranceCompany->id,
        'currency' => 'NGN',
        'period_start' => '2026-07-01',
        'period_end' => '2027-06-30',
        'risks' => [
            [
                'item_type' => 'property',
                'description' => 'Building coverage',
                'coverage_amount' => 1500000,
                'premium' => 45000,
                'net_premium' => 40500,
            ],
            [
                'item_type' => 'liability',
                'description' => 'Third party liability',
                'coverage_amount' => 500000,
                'premium' => 15000,
                'net_premium' => 13500,
            ],
        ],
        'clauses' => [
            [
                'clause_type' => 'standard',
                'title' => 'Cancellation Clause',
                'content' => 'This policy may be cancelled by either party...',
            ],
        ],
    ];

    $response = $this->actingAs($this->user)
        ->post(route('broker-slips.store-direct'), $payload);

    $response->assertRedirect();

    $brokerSlip = BrokerSlip::first();
    expect($brokerSlip->risks)->toHaveCount(2);
    expect($brokerSlip->clauses)->toHaveCount(1);
});

it('prevents duplicate active slips for the same insurer via direct creation', function () {
    $payload = [
        'customer_id' => $this->customer->id,
        'policy_product_id' => $this->policyProduct->id,
        'insurance_company_id' => $this->insuranceCompany->id,
        'currency' => 'NGN',
        'period_start' => '2026-07-01',
        'period_end' => '2027-06-30',
        'risks' => [
            [
                'item_type' => 'property',
                'description' => 'Coverage',
                'coverage_amount' => 500000,
                'premium' => 15000,
                'net_premium' => 13500,
            ],
        ],
    ];

    $this->actingAs($this->user)
        ->post(route('broker-slips.store-direct'), $payload);

    $response = $this->actingAs($this->user)
        ->post(route('broker-slips.store-direct'), $payload);

    $response->assertSessionHasErrors(['insurance_company_id']);
});

it('allows creating multiple direct slips for the same insurer for different customers or products', function () {
    $payload1 = [
        'customer_id' => $this->customer->id,
        'policy_product_id' => $this->policyProduct->id,
        'insurance_company_id' => $this->insuranceCompany->id,
        'currency' => 'NGN',
        'period_start' => '2026-07-01',
        'period_end' => '2027-06-30',
        'risks' => [
            [
                'item_type' => 'property',
                'description' => 'Coverage',
                'coverage_amount' => 500000,
                'premium' => 15000,
            ],
        ],
    ];

    $this->actingAs($this->user)
        ->post(route('broker-slips.store-direct'), $payload1)
        ->assertRedirect();

    $anotherCustomer = \App\Models\Customer::factory()->create([
        'tenant_id' => $this->user->tenant_id,
    ]);

    $payload2 = $payload1;
    $payload2['customer_id'] = $anotherCustomer->id;

    $this->actingAs($this->user)
        ->post(route('broker-slips.store-direct'), $payload2)
        ->assertRedirect();
});
