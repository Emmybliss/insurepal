<?php

use App\Enums\AllocationType;
use App\Models\Claim;
use App\Models\ClientBankAccount;
use App\Models\CreditNote;
use App\Models\Customer;
use App\Models\InsuranceCompany;
use App\Models\NaicomReportRun;
use App\Models\Placement;
use App\Models\PlacementMarket;
use App\Models\Policy;
use App\Models\Receipt;
use App\Models\ReceiptAllocation;
use App\Models\Remittance;
use App\Models\RemittanceAllocation;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Naicom\NaicomForm72CService;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
    Permission::create(['name' => 'naicom-reports.generate', 'guard_name' => 'web']);
    Permission::create(['name' => 'naicom-reports.view', 'guard_name' => 'web']);
    $this->user->givePermissionTo('naicom-reports.generate', 'naicom-reports.view');
    $this->actingAs($this->user);

    $this->service = app(NaicomForm72CService::class);

    $this->customer = Customer::factory()->create([
        'tenant_id' => $this->tenant->id,
        'first_name' => 'John',
        'last_name' => 'Doe',
        'type' => 'individual',
        'email' => 'john@example.com',
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
        'month', 'month_name', 'count', 'total_received',
        'premium_due', 'premium_remitted',
        'total_outstanding_premium', 'total_outstanding_commission',
    ]);
    expect($data['monthly_summaries'][0]['count'])->toBe(0);
    expect($data['period'])->toHaveKeys(['start', 'end', 'half', 'year']);
});

it('calculates premium due to insurers correctly', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurer_name' => $this->insurer->name,
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
        'is_direct_to_insurer' => false,
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    expect($data['rows'])->toHaveCount(1);
    expect($data['rows'][0]['total_received'])->toBe(100000.0);
    expect($data['rows'][0]['premium_due_to_insurers'])->toBe(100000.0);
});

it('calculates commission and outstanding correctly with placement markets', function () {
    $product = \App\Models\PolicyProduct::factory()->create(['tenant_id' => $this->tenant->id]);

    $placement = Placement::create([
        'tenant_id' => $this->tenant->id,
        'placement_number' => 'PL-TEST-001',
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
        'status' => 'active',
    ]);

    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'amount_paid' => 200000,
    ]);

    ReceiptAllocation::factory()->premium()->create([
        'tenant_id' => $this->tenant->id,
        'receipt_id' => $receipt->id,
        'policy_id' => $policy->id,
        'amount' => 200000,
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    $row = $data['rows'][0];
    expect($row['commission_due_co_broker'])->toBe(5000.0);
    expect($row['commission_due_reporting_broker'])->toBe(10000.0);
    expect($row['premium_due_to_insurers'])->toBe(185000.0);
    expect($row['outstanding_premium'])->toBe(185000.0);
    expect($row['outstanding_commission'])->toBe(15000.0);
});

it('calculates outstanding as due minus remitted', function () {
    $product = \App\Models\PolicyProduct::factory()->create(['tenant_id' => $this->tenant->id]);

    $placement = Placement::create([
        'tenant_id' => $this->tenant->id,
        'placement_number' => 'PL-TEST-002',
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
        'status' => 'active',
    ]);

    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'amount_paid' => 200000,
    ]);

    ReceiptAllocation::factory()->premium()->create([
        'tenant_id' => $this->tenant->id,
        'receipt_id' => $receipt->id,
        'policy_id' => $policy->id,
        'amount' => 200000,
    ]);

    $bankAccount = ClientBankAccount::factory()->create([
        'tenant_id' => $this->tenant->id,
        'bank_name' => 'GTBank',
    ]);

    $remittance = Remittance::factory()->create([
        'tenant_id' => $this->tenant->id,
        'client_bank_account_id' => $bankAccount->id,
        'insurer_id' => $this->insurer->id,
        'remittance_date' => now()->subMonth(),
        'total_amount' => 100000,
        'status' => 'completed',
    ]);

    RemittanceAllocation::create([
        'tenant_id' => $this->tenant->id,
        'remittance_id' => $remittance->id,
        'allocatable_type' => Policy::class,
        'allocatable_id' => $policy->id,
        'allocation_type' => AllocationType::Premium,
        'amount' => 100000,
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    $row = $data['rows'][0];
    expect($row['premium_remitted'])->toBe(100000.0);
    expect($row['outstanding_premium'])->toBe(85000.0);
    expect($row['over_remitted_premium'])->toBe(0.0);
});

it('identifies over-remittance', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurer_name' => $this->insurer->name,
        'effective_date' => now()->subMonths(2),
        'expiry_date' => now()->addMonths(10),
        'premium_amount' => 50000,
        'status' => 'active',
    ]);

    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'amount_paid' => 50000,
    ]);

    ReceiptAllocation::factory()->premium()->create([
        'tenant_id' => $this->tenant->id,
        'receipt_id' => $receipt->id,
        'policy_id' => $policy->id,
        'amount' => 50000,
    ]);

    $remittance = Remittance::factory()->create([
        'tenant_id' => $this->tenant->id,
        'insurer_id' => $this->insurer->id,
        'remittance_date' => now()->subMonth(),
        'total_amount' => 70000,
        'status' => 'completed',
    ]);

    RemittanceAllocation::create([
        'tenant_id' => $this->tenant->id,
        'remittance_id' => $remittance->id,
        'allocatable_type' => Policy::class,
        'allocatable_id' => $policy->id,
        'allocation_type' => AllocationType::Premium,
        'amount' => 70000,
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    $row = $data['rows'][0];
    expect($row['outstanding_premium'])->toBe(0.0);
    expect($row['over_remitted_premium'])->toBe(20000.0);
});

it('calculates claims due to insured', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurer_name' => $this->insurer->name,
        'effective_date' => now()->subMonths(2),
        'expiry_date' => now()->addMonths(10),
        'premium_amount' => 100000,
        'status' => 'active',
    ]);

    Claim::create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $policy->id,
        'customer_id' => $this->customer->id,
        'claim_reference' => 'CLM-001',
        'claim_type' => 'accident',
        'incident_date' => now()->subMonths(3),
        'incident_description' => 'Test accident claim',
        'claim_amount' => 500000,
        'approved_amount' => 450000,
        'status' => 'approved',
    ]);

    Claim::create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $policy->id,
        'customer_id' => $this->customer->id,
        'claim_reference' => 'CLM-002',
        'claim_type' => 'theft',
        'incident_date' => now()->subMonths(2),
        'incident_description' => 'Test theft claim',
        'claim_amount' => 300000,
        'approved_amount' => 250000,
        'status' => 'settled',
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    $row = $data['rows'][0];
    expect($row['claims_due_to_insured'])->toBe(700000.0);
});

it('calculates returned premium from credit notes', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurer_name' => $this->insurer->name,
        'effective_date' => now()->subMonths(2),
        'expiry_date' => now()->addMonths(10),
        'premium_amount' => 100000,
        'status' => 'active',
    ]);

    CreditNote::create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $policy->id,
        'customer_id' => $this->customer->id,
        'amount' => 15000,
        'total_amount' => 15000,
        'description' => 'Return premium credit note',
        'type' => 'standard',
        'status' => 'issued',
        'note_number' => 'CN-001',
        'issue_date' => now(),
        'currency_code' => 'NGN',
        'created_by_id' => $this->user->id,
        'sequence_number' => 1,
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    expect($data['rows'][0]['returned_premium_due'])->toBe(15000.0);
});

it('generates report via controller successfully', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurer_name' => $this->insurer->name,
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
    expect($run->status->value)->toBe('generated');

    $lineCount = $run->lines()->where('form_type', '7.2C')->count();
    expect($lineCount)->toBe(1);

    $showResponse = $this->get(route('reports.naicom.show', [
        'reportRun' => $run,
        'form' => '7.2C',
    ]));

    $showResponse->assertStatus(200);
    $showResponse->assertInertia(fn ($page) => $page->component('reports/naicom/show'));
});

it('returns correct monthly summaries structure', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurer_name' => $this->insurer->name,
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

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    expect($data['monthly_summaries'])->toBeArray();
    expect($data['monthly_summaries'][0])->toHaveKeys([
        'month', 'month_name', 'count', 'total_received',
        'premium_due', 'premium_remitted',
        'total_outstanding_premium', 'total_outstanding_commission',
    ]);
});

it('supports remittance allocations routing to correct policy via claim', function () {
    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurer_name' => $this->insurer->name,
        'effective_date' => now()->subMonths(2),
        'expiry_date' => now()->addMonths(10),
        'premium_amount' => 100000,
        'status' => 'active',
    ]);

    $claim = Claim::create([
        'tenant_id' => $this->tenant->id,
        'policy_id' => $policy->id,
        'customer_id' => $this->customer->id,
        'claim_reference' => 'CLM-001',
        'claim_type' => 'accident',
        'incident_date' => now()->subMonths(3),
        'incident_description' => 'Test claim for routing',
        'claim_amount' => 500000,
        'approved_amount' => 450000,
        'status' => 'approved',
    ]);

    $remittance = Remittance::factory()->create([
        'tenant_id' => $this->tenant->id,
        'insurer_id' => $this->insurer->id,
        'remittance_date' => now()->subMonth(),
        'total_amount' => 450000,
        'status' => 'completed',
    ]);

    RemittanceAllocation::create([
        'tenant_id' => $this->tenant->id,
        'remittance_id' => $remittance->id,
        'allocatable_type' => Claim::class,
        'allocatable_id' => $claim->id,
        'allocation_type' => AllocationType::Claim,
        'amount' => 450000,
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    $row = $data['rows'][0];
    expect($row['claims_due_to_insured'])->toBe(450000.0);
    expect($row['claim_return_deposit_remitted'])->toBe(450000.0);
    expect($row['outstanding_claim_return_deposit'])->toBe(0.0);
});
