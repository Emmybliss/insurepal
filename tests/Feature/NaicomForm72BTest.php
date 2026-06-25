<?php

use App\Models\Customer;
use App\Models\InsuranceCompany;
use App\Models\NaicomReportRun;
use App\Models\Placement;
use App\Models\PlacementMarket;
use App\Models\Policy;
use App\Models\PolicyProduct;
use App\Models\Receipt;
use App\Models\ReceiptAllocation;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Naicom\NaicomForm72BService;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
    Permission::create(['name' => 'naicom-reports.generate', 'guard_name' => 'web']);
    Permission::create(['name' => 'naicom-reports.view', 'guard_name' => 'web']);
    $this->user->givePermissionTo('naicom-reports.generate', 'naicom-reports.view');
    $this->actingAs($this->user);

    $this->service = app(NaicomForm72BService::class);

    $this->customer = Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'type' => 'individual',
        'email' => 'jane@example.com',
    ]);

    $this->insurer = InsuranceCompany::factory()->create();
});

it('generates empty data when no policies exist', function () {
    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: 'H1',
    );

    expect($data['rows'])->toBe([]);
    expect($data['monthly_summaries'])->toHaveCount(6);
    expect($data['monthly_summaries'][0])->toHaveKeys([
        'month', 'month_name', 'count', 'total_gross_premium',
        'total_commission', 'total_earned', 'total_deferred',
    ]);
    expect($data['monthly_summaries'][0]['count'])->toBe(0);
    expect($data['period'])->toHaveKeys(['start', 'end', 'half', 'year', 'cutoff_date']);
});

it('generates a row for a single active policy with placement and receipt', function () {
    $product = PolicyProduct::factory()->create(['tenant_id' => $this->tenant->id]);

    $placement = Placement::create([
        'tenant_id' => $this->tenant->id,
        'placement_number' => 'PL-72B-001',
        'customer_id' => $this->customer->id,
        'policy_product_id' => $product->id,
        'proposed_start_date' => now()->subYear(),
        'proposed_end_date' => now()->addYear(),
        'created_by' => $this->user->id,
        'status' => 'active',
    ]);

    PlacementMarket::create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $placement->id,
        'insurance_company_id' => $this->insurer->id,
        'is_lead' => true,
        'co_broker_commission' => 5000,
        'reporting_broker_commission' => 10000,
    ]);

    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurer_name' => $this->insurer->name,
        'placement_id' => $placement->id,
        'effective_date' => now()->subMonths(2),
        'expiry_date' => now()->addMonths(10),
        'premium_amount' => 200000,
        'sum_insured' => 5000000,
        'status' => 'active',
    ]);

    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'payment_method' => 'bank_transfer',
        'amount_paid' => 200000,
    ]);

    ReceiptAllocation::factory()->premium()->create([
        'tenant_id' => $this->tenant->id,
        'receipt_id' => $receipt->id,
        'policy_id' => $policy->id,
        'amount' => 200000,
        'is_direct_to_insurer' => false,
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    expect($data['rows'])->toHaveCount(1);

    $row = $data['rows'][0];
    expect($row['serial_number'])->toBe(1);
    expect($row['customer_name'])->toBe('Jane Smith');
    expect($row['insurer_name'])->toBe($this->insurer->name);
    expect($row['sum_insured'])->toBe(5000000.0);
    expect($row['premium_to_broker_local'])->toBe(200000.0);
    expect($row['total_gross_premium'])->toBe(200000.0);
    expect($row['co_broker_commission'])->toBe(5000.0);
    expect($row['reporting_broker_commission'])->toBe(10000.0);
    expect($row['total_commission'])->toBe(15000.0);
    expect($row['payment_method'])->toBe('bank_transfer');
});

it('categorises receipt allocations as direct to insurer, broker local, and broker foreign', function () {
    $product = PolicyProduct::factory()->create(['tenant_id' => $this->tenant->id]);

    $placement = Placement::create([
        'tenant_id' => $this->tenant->id,
        'placement_number' => 'PL-72B-ALLOC',
        'customer_id' => $this->customer->id,
        'policy_product_id' => $product->id,
        'proposed_start_date' => now()->subYear(),
        'proposed_end_date' => now()->addYear(),
        'created_by' => $this->user->id,
        'status' => 'active',
    ]);

    PlacementMarket::create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $placement->id,
        'insurance_company_id' => $this->insurer->id,
        'is_lead' => true,
        'co_broker_commission' => 2000,
        'reporting_broker_commission' => 3000,
    ]);

    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurer_name' => $this->insurer->name,
        'placement_id' => $placement->id,
        'effective_date' => now()->subMonths(2),
        'expiry_date' => now()->addMonths(10),
        'premium_amount' => 100000,
        'status' => 'active',
    ]);

    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'amount_paid' => 100000,
    ]);

    ReceiptAllocation::factory()->premium()->create([
        'tenant_id' => $this->tenant->id,
        'receipt_id' => $receipt->id,
        'policy_id' => $policy->id,
        'amount' => 30000,
        'is_direct_to_insurer' => true,
        'currency' => 'NGN',
    ]);

    ReceiptAllocation::factory()->premium()->create([
        'tenant_id' => $this->tenant->id,
        'receipt_id' => $receipt->id,
        'policy_id' => $policy->id,
        'amount' => 50000,
        'is_direct_to_insurer' => false,
        'currency' => 'NGN',
    ]);

    ReceiptAllocation::factory()->premium()->create([
        'tenant_id' => $this->tenant->id,
        'receipt_id' => $receipt->id,
        'policy_id' => $policy->id,
        'amount' => 20000,
        'is_direct_to_insurer' => false,
        'currency' => 'USD',
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    $row = $data['rows'][0];
    expect($row['premium_direct_to_insurers'])->toBe(30000.0);
    expect($row['premium_to_broker_local'])->toBe(50000.0);
    expect($row['premium_to_broker_foreign'])->toBe(20000.0);
    expect($row['total_gross_premium'])->toBe(100000.0);
});

it('enforces tenant isolation', function () {
    $otherTenant = Tenant::factory()->create();

    $product = PolicyProduct::factory()->create(['tenant_id' => $this->tenant->id]);

    $placement = Placement::create([
        'tenant_id' => $this->tenant->id,
        'placement_number' => 'PL-72B-T1',
        'customer_id' => $this->customer->id,
        'policy_product_id' => $product->id,
        'proposed_start_date' => now()->subYear(),
        'proposed_end_date' => now()->addYear(),
        'created_by' => $this->user->id,
        'status' => 'active',
    ]);

    PlacementMarket::create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $placement->id,
        'insurance_company_id' => $this->insurer->id,
        'is_lead' => true,
        'reporting_broker_commission' => 5000,
    ]);

    Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'placement_id' => $placement->id,
        'effective_date' => now()->subMonths(2),
        'expiry_date' => now()->addMonths(10),
        'premium_amount' => 100000,
        'status' => 'active',
    ]);

    $otherCustomer = Customer::factory()->create([
        'tenant_id' => $otherTenant->id,
        'type' => 'individual',
    ]);

    $otherProduct = PolicyProduct::factory()->create(['tenant_id' => $otherTenant->id]);

    $otherPlacement = Placement::create([
        'tenant_id' => $otherTenant->id,
        'placement_number' => 'PL-72B-T2',
        'customer_id' => $otherCustomer->id,
        'policy_product_id' => $otherProduct->id,
        'proposed_start_date' => now()->subYear(),
        'proposed_end_date' => now()->addYear(),
        'created_by' => $this->user->id,
        'status' => 'active',
    ]);

    PlacementMarket::create([
        'tenant_id' => $otherTenant->id,
        'placement_id' => $otherPlacement->id,
        'insurance_company_id' => $this->insurer->id,
        'is_lead' => true,
        'reporting_broker_commission' => 8000,
    ]);

    Policy::factory()->create([
        'tenant_id' => $otherTenant->id,
        'customer_id' => $otherCustomer->id,
        'placement_id' => $otherPlacement->id,
        'effective_date' => now()->subMonths(1),
        'expiry_date' => now()->addMonths(11),
        'premium_amount' => 999999,
        'status' => 'active',
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    expect($data['rows'])->toHaveCount(1);
    expect($data['rows'][0]['premium_to_broker_local'])->toEqual(0);
});

it('handles H1 and H2 reporting periods', function () {
    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: 2026,
        reportingHalf: 'H2',
    );

    expect($data['rows'])->toBe([]);
    expect($data['period']['start'])->toBe('2026-07-01');
    expect($data['period']['end'])->toBe('2026-12-31');
    expect($data['period']['half'])->toBe('H2');
    expect($data['period']['year'])->toBe(2026);
    expect($data['monthly_summaries'][0]['month'])->toBe(7);
    expect($data['monthly_summaries'][0]['month_name'])->toBe('July');
    expect($data['monthly_summaries'][5]['month'])->toBe(12);

    $dataH1 = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: 2026,
        reportingHalf: 'H1',
    );

    expect($dataH1['period']['start'])->toBe('2026-01-01');
    expect($dataH1['period']['end'])->toBe('2026-06-30');
    expect($dataH1['monthly_summaries'][0]['month'])->toBe(1);
    expect($dataH1['monthly_summaries'][5]['month'])->toBe(6);
});

it('increments serial numbers across multiple policies', function () {
    $product = PolicyProduct::factory()->create(['tenant_id' => $this->tenant->id]);

    $placement = Placement::create([
        'tenant_id' => $this->tenant->id,
        'placement_number' => 'PL-72B-SN',
        'customer_id' => $this->customer->id,
        'policy_product_id' => $product->id,
        'proposed_start_date' => now()->subYear(),
        'proposed_end_date' => now()->addYear(),
        'created_by' => $this->user->id,
        'status' => 'active',
    ]);

    PlacementMarket::create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $placement->id,
        'insurance_company_id' => $this->insurer->id,
        'is_lead' => true,
        'reporting_broker_commission' => 5000,
    ]);

    Policy::factory()->count(3)->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'placement_id' => $placement->id,
        'insurer_name' => $this->insurer->name,
        'effective_date' => now()->subMonths(2),
        'expiry_date' => now()->addMonths(10),
        'premium_amount' => 50000,
        'status' => 'active',
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    expect($data['rows'])->toHaveCount(3);
    expect($data['rows'][0]['serial_number'])->toBe(1);
    expect($data['rows'][1]['serial_number'])->toBe(2);
    expect($data['rows'][2]['serial_number'])->toBe(3);
});

it('calculates premium received by broker correctly', function () {
    $product = PolicyProduct::factory()->create(['tenant_id' => $this->tenant->id]);

    $placement = Placement::create([
        'tenant_id' => $this->tenant->id,
        'placement_number' => 'PL-72B-PRB',
        'customer_id' => $this->customer->id,
        'policy_product_id' => $product->id,
        'proposed_start_date' => now()->subYear(),
        'proposed_end_date' => now()->addYear(),
        'created_by' => $this->user->id,
        'status' => 'active',
    ]);

    PlacementMarket::create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $placement->id,
        'insurance_company_id' => $this->insurer->id,
        'is_lead' => true,
        'reporting_broker_commission' => 10000,
    ]);

    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'placement_id' => $placement->id,
        'effective_date' => now()->subMonths(2),
        'expiry_date' => now()->addMonths(10),
        'premium_amount' => 100000,
        'status' => 'active',
    ]);

    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'amount_paid' => 100000,
    ]);

    ReceiptAllocation::factory()->premium()->create([
        'tenant_id' => $this->tenant->id,
        'receipt_id' => $receipt->id,
        'policy_id' => $policy->id,
        'amount' => 40000,
        'is_direct_to_insurer' => true,
    ]);

    ReceiptAllocation::factory()->premium()->create([
        'tenant_id' => $this->tenant->id,
        'receipt_id' => $receipt->id,
        'policy_id' => $policy->id,
        'amount' => 60000,
        'is_direct_to_insurer' => false,
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    $row = $data['rows'][0];
    expect($row['premium_received_by_broker'])->toBe(60000.0);
});

it('returns monthly summaries structure with aggregated data', function () {
    $product = PolicyProduct::factory()->create(['tenant_id' => $this->tenant->id]);

    $placement = Placement::create([
        'tenant_id' => $this->tenant->id,
        'placement_number' => 'PL-72B-SUM',
        'customer_id' => $this->customer->id,
        'policy_product_id' => $product->id,
        'proposed_start_date' => now()->subYear(),
        'proposed_end_date' => now()->addYear(),
        'created_by' => $this->user->id,
        'status' => 'active',
    ]);

    PlacementMarket::create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $placement->id,
        'insurance_company_id' => $this->insurer->id,
        'is_lead' => true,
        'reporting_broker_commission' => 10000,
    ]);

    Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'placement_id' => $placement->id,
        'effective_date' => now()->subMonths(2),
        'expiry_date' => now()->addMonths(10),
        'premium_amount' => 100000,
        'status' => 'active',
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    expect($data['monthly_summaries'])->toBeArray();
    expect($data['monthly_summaries'][0])->toHaveKeys([
        'month', 'month_name', 'count', 'total_gross_premium',
        'total_commission', 'total_earned', 'total_deferred',
    ]);
});

it('generates data via controller store and retrieves via show', function () {
    $product = PolicyProduct::factory()->create(['tenant_id' => $this->tenant->id]);

    $placement = Placement::create([
        'tenant_id' => $this->tenant->id,
        'placement_number' => 'PL-72B-CTRL',
        'customer_id' => $this->customer->id,
        'policy_product_id' => $product->id,
        'proposed_start_date' => now()->subYear(),
        'proposed_end_date' => now()->addYear(),
        'created_by' => $this->user->id,
        'status' => 'active',
    ]);

    PlacementMarket::create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $placement->id,
        'insurance_company_id' => $this->insurer->id,
        'is_lead' => true,
        'co_broker_commission' => 2000,
        'reporting_broker_commission' => 8000,
    ]);

    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurer_name' => $this->insurer->name,
        'placement_id' => $placement->id,
        'effective_date' => now()->subMonths(2),
        'expiry_date' => now()->addMonths(10),
        'premium_amount' => 100000,
        'status' => 'active',
    ]);

    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'amount_paid' => 100000,
    ]);

    ReceiptAllocation::factory()->premium()->create([
        'tenant_id' => $this->tenant->id,
        'receipt_id' => $receipt->id,
        'policy_id' => $policy->id,
        'amount' => 100000,
    ]);

    $response = $this->post(route('reports.naicom.store'), [
        'reporting_year' => now()->year,
        'reporting_half' => now()->month <= 6 ? 'H1' : 'H2',
    ]);

    $response->assertRedirect();

    $run = NaicomReportRun::first();
    expect($run)->not->toBeNull();
    expect($run->lines()->where('form_type', '7.2B')->count())->toBe(1);

    $showResponse = $this->get(route('reports.naicom.show', [
        'reportRun' => $run,
        'form' => '7.2B',
    ]));

    $showResponse->assertStatus(200);
    $showResponse->assertInertia(fn ($page) => $page->component('reports/naicom/show'));
});

it('policies outside the reporting period are excluded', function () {
    $product = PolicyProduct::factory()->create(['tenant_id' => $this->tenant->id]);

    $placement = Placement::create([
        'tenant_id' => $this->tenant->id,
        'placement_number' => 'PL-72B-OUT',
        'customer_id' => $this->customer->id,
        'policy_product_id' => $product->id,
        'proposed_start_date' => '2020-01-01',
        'proposed_end_date' => '2020-06-01',
        'created_by' => $this->user->id,
        'status' => 'expired',
    ]);

    PlacementMarket::create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $placement->id,
        'insurance_company_id' => $this->insurer->id,
        'is_lead' => true,
        'reporting_broker_commission' => 5000,
    ]);

    Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'placement_id' => $placement->id,
        'effective_date' => '2020-02-01',
        'expiry_date' => '2020-05-31',
        'premium_amount' => 50000,
        'status' => 'expired',
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: 'H1',
    );

    expect($data['rows'])->toBe([]);
});

it('calculates net premium as gross minus commissions', function () {
    $product = PolicyProduct::factory()->create(['tenant_id' => $this->tenant->id]);

    $placement = Placement::create([
        'tenant_id' => $this->tenant->id,
        'placement_number' => 'PL-72B-NET',
        'customer_id' => $this->customer->id,
        'policy_product_id' => $product->id,
        'proposed_start_date' => now()->subYear(),
        'proposed_end_date' => now()->addYear(),
        'created_by' => $this->user->id,
        'status' => 'active',
    ]);

    PlacementMarket::create([
        'tenant_id' => $this->tenant->id,
        'placement_id' => $placement->id,
        'insurance_company_id' => $this->insurer->id,
        'is_lead' => true,
        'co_broker_commission' => 4000,
        'reporting_broker_commission' => 6000,
    ]);

    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'placement_id' => $placement->id,
        'effective_date' => now()->subMonths(2),
        'expiry_date' => now()->addMonths(10),
        'premium_amount' => 100000,
        'status' => 'active',
        'net_premium' => null,
    ]);

    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'amount_paid' => 100000,
    ]);

    ReceiptAllocation::factory()->premium()->create([
        'tenant_id' => $this->tenant->id,
        'receipt_id' => $receipt->id,
        'policy_id' => $policy->id,
        'amount' => 100000,
        'is_direct_to_insurer' => false,
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    expect($data['rows'][0]['net_premium'])->toBe(90000.0);
});
