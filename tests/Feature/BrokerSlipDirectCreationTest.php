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
        'insurance_company_id' => $this->insuranceCompany->id,
        'currency' => 'NGN',
        'sum_insured' => 1000000,
        'rate' => 5.5,
        'rate_basis' => 'percentage',
        'gross_premium' => 55000,
        'commission_rate' => 10,
        'commission_amount' => 5500,
        'net_premium' => 49500,
        'period_start' => '2026-07-01',
        'period_end' => '2027-06-30',
        'risk_details' => 'Comprehensive motor insurance for a 2020 Toyota Camry',
    ];

    $response = $this->actingAs($this->user)
        ->post(route('broker-slips.store-direct'), $payload);

    $response->assertRedirect();

    $brokerSlip = BrokerSlip::first();
    expect($brokerSlip)->not->toBeNull();
    expect($brokerSlip->sum_insured)->toEqual(1000000.0);
    expect($brokerSlip->net_premium)->toEqual(49500.0);
    expect($brokerSlip->status)->toEqual('draft');

    $placement = $brokerSlip->placement;
    expect($placement)->not->toBeNull();
    expect($placement->customer_id)->toEqual($this->customer->id);
    expect($placement->policy_product_id)->toEqual($this->policyProduct->id);
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
        'sum_insured',
        'gross_premium',
        'net_premium',
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
        'sum_insured' => 500000,
        'rate' => 3.0,
        'rate_basis' => 'percentage',
        'gross_premium' => 15000,
        'net_premium' => 13500,
        'period_start' => '2026-07-01',
        'period_end' => '2027-06-30',
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
        'sum_insured' => 500000,
        'gross_premium' => 15000,
        'net_premium' => 13500,
        'period_start' => '2026-07-01',
        'period_end' => '2027-06-30',
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
        'sum_insured' => 2000000,
        'gross_premium' => 60000,
        'net_premium' => 54000,
        'period_start' => '2026-07-01',
        'period_end' => '2027-06-30',
        'items' => [
            [
                'item_type' => 'property',
                'description' => 'Building coverage',
                'sum_insured' => 1500000,
            ],
            [
                'item_type' => 'liability',
                'description' => 'Third party liability',
                'sum_insured' => 500000,
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
    expect($brokerSlip->items)->toHaveCount(2);
    expect($brokerSlip->clauses)->toHaveCount(1);
});

it('prevents duplicate active slips for the same insurer via direct creation', function () {
    $payload = [
        'customer_id' => $this->customer->id,
        'policy_product_id' => $this->policyProduct->id,
        'insurance_company_id' => $this->insuranceCompany->id,
        'currency' => 'NGN',
        'sum_insured' => 500000,
        'gross_premium' => 15000,
        'net_premium' => 13500,
        'period_start' => '2026-07-01',
        'period_end' => '2027-06-30',
    ];

    $this->actingAs($this->user)
        ->post(route('broker-slips.store-direct'), $payload);

    $response = $this->actingAs($this->user)
        ->post(route('broker-slips.store-direct'), $payload);

    $response->assertSessionHasErrors(['insurance_company_id']);
});
