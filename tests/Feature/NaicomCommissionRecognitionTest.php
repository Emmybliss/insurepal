<?php

use App\Models\Customer;
use App\Models\InsuranceCompany;
use App\Models\Placement;
use App\Models\PlacementMarket;
use App\Models\Policy;
use App\Models\PolicyProduct;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Naicom\NaicomCommissionRecognitionService;
use Carbon\Carbon;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
    Permission::create(['name' => 'naicom-reports.generate', 'guard_name' => 'web']);
    $this->user->givePermissionTo('naicom-reports.generate');
    $this->actingAs($this->user);

    $this->service = app(NaicomCommissionRecognitionService::class);

    $customer = Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'type' => 'individual',
    ]);

    $insurer = InsuranceCompany::factory()->create();

    $product = PolicyProduct::factory()->create(['tenant_id' => $this->tenant->id]);

    $this->placement = Placement::create([
        'tenant_id' => $this->tenant->id,
        'placement_number' => 'PL-COMM-TEST',
        'customer_id' => $customer->id,
        'policy_product_id' => $product->id,
        'proposed_start_date' => now()->subYear(),
        'proposed_end_date' => now()->addYear(),
        'created_by' => $this->user->id,
        'status' => 'active',
    ]);

    PlacementMarket::create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $this->placement->id,
        'insurance_company_id' => $insurer->id,
        'is_lead' => true,
        'co_broker_commission' => 3000,
        'reporting_broker_commission' => 12000,
    ]);
});

it('returns zeros when policy has no placement', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => null,
        'effective_date' => now()->subMonths(3),
        'expiry_date' => now()->addMonths(9),
    ]);

    $result = $this->service->calculateEarnedCommission(
        $policy,
        Carbon::parse('2026-06-30'),
        Carbon::parse('2026-01-01'),
    );

    expect($result['earned'])->toBe(0.0);
    expect($result['deferred'])->toBe(0.0);
    expect($result['total'])->toBe(0.0);
});

it('returns zeros when placement has no lead market', function () {
    $insurer = InsuranceCompany::factory()->create();
    $product = PolicyProduct::factory()->create(['tenant_id' => $this->tenant->id]);
    $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id, 'type' => 'individual']);

    $noLeadPlacement = Placement::create([
        'tenant_id' => $this->tenant->id,
        'placement_number' => 'PL-NO-LEAD',
        'customer_id' => $customer->id,
        'policy_product_id' => $product->id,
        'proposed_start_date' => now()->subYear(),
        'proposed_end_date' => now()->addYear(),
        'created_by' => $this->user->id,
        'status' => 'active',
    ]);

    PlacementMarket::create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $noLeadPlacement->id,
        'insurance_company_id' => $insurer->id,
        'is_lead' => false,
        'reporting_broker_commission' => 5000,
    ]);

    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $noLeadPlacement->id,
        'effective_date' => now()->subMonths(3),
        'expiry_date' => now()->addMonths(9),
    ]);

    $result = $this->service->calculateEarnedCommission(
        $policy,
        Carbon::parse('2026-06-30'),
        Carbon::parse('2026-01-01'),
    );

    expect($result['earned'])->toBe(0.0);
    expect($result['deferred'])->toBe(0.0);
    expect($result['total'])->toBe(0.0);
});

it('returns full commission when effective and expiry are same day', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $this->placement->id,
        'effective_date' => '2026-06-15',
        'expiry_date' => '2026-06-15',
    ]);

    $result = $this->service->calculateEarnedCommission(
        $policy,
        Carbon::parse('2026-06-30'),
        Carbon::parse('2026-01-01'),
    );

    expect($result['earned'])->toBe(12000.0);
    expect($result['deferred'])->toBe(0.0);
    expect($result['total'])->toBe(12000.0);
});

it('calculates earned proportionally for partial period', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $this->placement->id,
        'effective_date' => '2026-01-01',
        'expiry_date' => '2026-12-31',
    ]);

    $result = $this->service->calculateEarnedCommission(
        $policy,
        Carbon::parse('2026-06-30'),
        Carbon::parse('2026-01-01'),
    );

    expect($result['total_days'])->toBe(364);
    expect($result['elapsed_days'])->toBe(180);
    expect($result['earned'])->toBe(round(12000 * 180 / 364, 2));
    expect($result['deferred'])->toBe(round(12000 - round(12000 * 180 / 364, 2), 2));
});

it('earns all commission when cutoff is after expiry', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $this->placement->id,
        'effective_date' => '2026-01-01',
        'expiry_date' => '2026-03-31',
    ]);

    $result = $this->service->calculateEarnedCommission(
        $policy,
        Carbon::parse('2026-06-30'),
        Carbon::parse('2026-01-01'),
    );

    expect($result['earned'])->toBe(12000.0);
    expect($result['deferred'])->toBe(0.0);
});

it('defers all commission when effective date is after cutoff', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $this->placement->id,
        'effective_date' => '2026-07-15',
        'expiry_date' => '2026-12-31',
    ]);

    $result = $this->service->calculateEarnedCommission(
        $policy,
        Carbon::parse('2026-06-30'),
        Carbon::parse('2026-01-01'),
    );

    expect($result['earned'])->toBe(0.0);
    expect($result['deferred'])->toBe(12000.0);
    expect($result['total'])->toBe(12000.0);
});

it('calculates earned commission for cancelled policy', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $this->placement->id,
        'effective_date' => '2026-01-01',
        'expiry_date' => '2026-12-31',
    ]);

    $result = $this->service->calculateEarnedCommissionForCancelled(
        $policy,
        Carbon::parse('2026-04-15'),
    );

    expect($result['earned'])->toBeGreaterThan(0.0);
    expect($result['deferred'])->toBeGreaterThan(0.0);
    expect($result['total'])->toBe(12000.0);
});

it('returns no earned commission when cancelled on effective date', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $this->placement->id,
        'effective_date' => '2026-04-15',
        'expiry_date' => '2026-12-31',
    ]);

    $result = $this->service->calculateEarnedCommissionForCancelled(
        $policy,
        Carbon::parse('2026-04-15'),
    );

    expect($result['earned'])->toBe(0.0);
    expect($result['deferred'])->toBe(12000.0);
    expect($result['total'])->toBe(12000.0);
});

it('handles policy spanning beyond period boundaries', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $this->placement->id,
        'effective_date' => '2025-06-01',
        'expiry_date' => '2027-06-01',
    ]);

    $result = $this->service->calculateEarnedCommission(
        $policy,
        Carbon::parse('2026-06-30'),
        Carbon::parse('2026-01-01'),
    );

    expect($result['elapsed_days'])->toBe(180);
    expect($result['total_days'])->toBe(730);
    expect($result['earned'])->toBe(round(12000 * 180 / 730, 2));
});
