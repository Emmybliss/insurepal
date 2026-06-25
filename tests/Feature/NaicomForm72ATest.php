<?php

use App\Models\ClientBankAccount;
use App\Models\Customer;
use App\Models\InsuranceCompany;
use App\Models\NaicomReportRun;
use App\Models\Policy;
use App\Models\Receipt;
use App\Models\ReceiptAllocation;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Naicom\NaicomForm72AService;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
    Permission::create(['name' => 'naicom-reports.generate', 'guard_name' => 'web']);
    Permission::create(['name' => 'naicom-reports.view', 'guard_name' => 'web']);
    $this->user->givePermissionTo('naicom-reports.generate', 'naicom-reports.view');
    $this->actingAs($this->user);

    $this->service = app(NaicomForm72AService::class);

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

    expect($data['rows'])->toHaveCount(6);
    expect($data['rows'][0])->toHaveKeys([
        'month', 'month_name', 'cash_in_hand', 'cheques_in_hand', 'bank_balance',
        'total_assets', 'premium_awaiting_remittance',
        'commission_co_broker_awaiting', 'commission_reporting_broker_awaiting',
        'vat_awaiting_remittance', 'others', 'total_liabilities',
    ]);
    expect($data['rows'][0]['total_assets'])->toBe(0.0);
    expect($data['rows'][0]['total_liabilities'])->toBe(0.0);
    expect($data['monthly_summaries'])->toHaveCount(6);
    expect($data['period'])->toHaveKeys(['start', 'end', 'half', 'year']);
});

it('calculates cash in hand from uncleared cash receipts', function () {
    $monthEnd = now()->endOfMonth();

    $policy = Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurer_name' => $this->insurer->name,
        'effective_date' => now()->subMonths(2),
        'expiry_date' => now()->addMonths(10),
        'premium_amount' => 50000,
        'status' => 'active',
    ]);

    Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'payment_method' => 'cash',
        'payment_date' => $monthEnd->copy()->subDays(5),
        'amount_paid' => 10000,
        'is_cleared' => false,
        'cleared_at' => null,
        'payment_status' => 'completed',
    ]);

    Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'payment_method' => 'cash',
        'payment_date' => $monthEnd->copy()->subDays(3),
        'amount_paid' => 5000,
        'is_cleared' => true,
        'cleared_at' => $monthEnd->copy()->subDay(),
        'payment_status' => 'completed',
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    $currentMonth = now()->month;
    $row = collect($data['rows'])->firstWhere('month', $currentMonth);
    expect($row)->not->toBeNull();
    expect($row['cash_in_hand'])->toBe(10000.0);
    expect($row['bank_balance'])->toBe(0.0);
});

it('calculates cheques in hand from uncleared cheque receipts', function () {
    $monthEnd = now()->endOfMonth();

    Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurer_name' => $this->insurer->name,
        'effective_date' => now()->subMonths(2),
        'expiry_date' => now()->addMonths(10),
        'premium_amount' => 50000,
        'status' => 'active',
    ]);

    Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'payment_method' => 'cheque',
        'payment_date' => $monthEnd->copy()->subDays(5),
        'amount_paid' => 20000,
        'is_cleared' => false,
        'cleared_at' => null,
        'payment_status' => 'completed',
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    $currentMonth = now()->month;
    $row = collect($data['rows'])->firstWhere('month', $currentMonth);
    expect($row)->not->toBeNull();
    expect($row['cheques_in_hand'])->toBe(20000.0);
});

it('calculates bank balance from non-cash non-cheque receipts', function () {
    $monthEnd = now()->endOfMonth();

    Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurer_name' => $this->insurer->name,
        'effective_date' => now()->subMonths(2),
        'expiry_date' => now()->addMonths(10),
        'premium_amount' => 50000,
        'status' => 'active',
    ]);

    Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'payment_method' => 'bank_transfer',
        'payment_date' => $monthEnd->copy()->subDays(3),
        'amount_paid' => 30000,
        'payment_status' => 'completed',
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    $currentMonth = now()->month;
    $row = collect($data['rows'])->firstWhere('month', $currentMonth);
    expect($row)->not->toBeNull();
    expect($row['bank_balance'])->toBe(30000.0);
});

it('calculates total assets as sum of cash, cheques, and bank', function () {
    $monthEnd = now()->endOfMonth();

    Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurer_name' => $this->insurer->name,
        'effective_date' => now()->subMonths(2),
        'expiry_date' => now()->addMonths(10),
        'premium_amount' => 50000,
        'status' => 'active',
    ]);

    Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'payment_method' => 'cash',
        'payment_date' => $monthEnd->copy()->subDays(5),
        'amount_paid' => 10000,
        'is_cleared' => false,
        'payment_status' => 'completed',
    ]);

    Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'payment_method' => 'cheque',
        'payment_date' => $monthEnd->copy()->subDays(3),
        'amount_paid' => 15000,
        'is_cleared' => false,
        'payment_status' => 'completed',
    ]);

    Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'payment_method' => 'bank_transfer',
        'payment_date' => $monthEnd->copy()->subDays(1),
        'amount_paid' => 25000,
        'payment_status' => 'completed',
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    $currentMonth = now()->month;
    $row = collect($data['rows'])->firstWhere('month', $currentMonth);
    expect($row)->not->toBeNull();
    expect($row['cash_in_hand'])->toBe(10000.0);
    expect($row['cheques_in_hand'])->toBe(15000.0);
    expect($row['bank_balance'])->toBe(25000.0);
    expect($row['total_assets'])->toBe(50000.0);
});

it('calculates liabilities from 72C rows', function () {
    $form72CRows = [
        [
            'month' => 1,
            'outstanding_premium' => 100000.0,
            'commission_due_co_broker' => 5000.0,
            'commission_due_reporting_broker' => 8000.0,
            'outstanding_vat' => 7500.0,
            'outstanding_claim_return_deposit' => 25000.0,
        ],
        [
            'month' => 1,
            'outstanding_premium' => 50000.0,
            'commission_due_co_broker' => 2000.0,
            'commission_due_reporting_broker' => 4000.0,
            'outstanding_vat' => 3750.0,
            'outstanding_claim_return_deposit' => 10000.0,
        ],
    ];

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: 'H1',
        form72CRows: $form72CRows,
    );

    $janRow = collect($data['rows'])->firstWhere('month', 1);
    expect($janRow)->not->toBeNull();
    expect($janRow['premium_awaiting_remittance'])->toBe(150000.0);
    expect($janRow['commission_co_broker_awaiting'])->toBe(7000.0);
    expect($janRow['commission_reporting_broker_awaiting'])->toBe(12000.0);
    expect($janRow['vat_awaiting_remittance'])->toBe(11250.0);
    expect($janRow['others'])->toBe(35000.0);
    expect($janRow['total_liabilities'])->toBe(215250.0);
});

it('enforces total assets equals total liabilities per month', function () {
    $monthEnd = now()->endOfMonth();
    $currentMonth = now()->month;

    Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurer_name' => $this->insurer->name,
        'effective_date' => now()->subMonths(2),
        'expiry_date' => now()->addMonths(10),
        'premium_amount' => 50000,
        'status' => 'active',
    ]);

    Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'payment_method' => 'bank_transfer',
        'payment_date' => $monthEnd->copy()->subDays(1),
        'amount_paid' => 50000,
        'payment_status' => 'completed',
    ]);

    $form72CRows = [
        [
            'month' => $currentMonth,
            'outstanding_premium' => 50000.0,
            'commission_due_co_broker' => 0.0,
            'commission_due_reporting_broker' => 0.0,
            'outstanding_vat' => 0.0,
            'outstanding_claim_return_deposit' => 0.0,
        ],
    ];

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
        form72CRows: $form72CRows,
    );

    $row = collect($data['rows'])->firstWhere('month', $currentMonth);
    expect($row)->not->toBeNull();
    expect($row['bank_balance'])->toBe(50000.0);
    expect($row['total_assets'])->toBe(50000.0);
    expect($row['total_liabilities'])->toBe(50000.0);
});

it('handles H2 period correctly', function () {
    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: 2026,
        reportingHalf: 'H2',
    );

    expect($data['rows'])->toHaveCount(6);
    expect($data['rows'][0]['month'])->toBe(7);
    expect($data['rows'][0]['month_name'])->toBe('July');
    expect($data['rows'][5]['month'])->toBe(12);
    expect($data['rows'][5]['month_name'])->toBe('December');

    expect($data['period']['start'])->toBe('2026-07-01');
    expect($data['period']['end'])->toBe('2026-12-31');
    expect($data['period']['half'])->toBe('H2');
});

it('generates all three forms via controller', function () {
    $product = \App\Models\PolicyProduct::factory()->create(['tenant_id' => $this->tenant->id]);

    $placement = \App\Models\Placement::create([
        'tenant_id' => $this->tenant->id,
        'placement_number' => 'PL-TEST-72A',
        'customer_id' => $this->customer->id,
        'policy_product_id' => $product->id,
        'proposed_start_date' => now()->subYear(),
        'proposed_end_date' => now()->addYear(),
        'created_by' => $this->user->id,
        'status' => 'active',
    ]);

    \App\Models\PlacementMarket::create([
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
        'premium_amount' => 100000,
        'status' => 'active',
    ]);

    $receipt = Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'payment_method' => 'bank_transfer',
        'payment_date' => now()->subMonth(),
        'amount_paid' => 100000,
        'payment_status' => 'completed',
    ]);

    ReceiptAllocation::factory()->premium()->create([
        'tenant_id' => $this->tenant->id,
        'receipt_id' => $receipt->id,
        'policy_id' => $policy->id,
        'amount' => 100000,
    ]);

    $bankAccount = ClientBankAccount::factory()->create([
        'tenant_id' => $this->tenant->id,
        'bank_name' => 'Access Bank',
    ]);

    \App\Models\Remittance::factory()->create([
        'tenant_id' => $this->tenant->id,
        'client_bank_account_id' => $bankAccount->id,
        'insurer_id' => $this->insurer->id,
        'remittance_date' => now()->subMonth(),
        'total_amount' => 50000,
        'status' => 'completed',
    ]);

    $response = $this->post(route('reports.naicom.store'), [
        'reporting_year' => now()->year,
        'reporting_half' => now()->month <= 6 ? 'H1' : 'H2',
    ]);

    $response->assertRedirect();

    $run = NaicomReportRun::first();
    expect($run)->not->toBeNull();
    expect($run->status->value)->toBe('generated');

    expect($run->lines()->where('form_type', '7.2A')->count())->toBe(6);
    expect($run->lines()->where('form_type', '7.2B')->count())->toBe(1);
    expect($run->lines()->where('form_type', '7.2C')->count())->toBe(1);

    expect($run->metadata)->toHaveKey('form_72a');
    expect($run->metadata['form_72a']['monthly_summaries'])->toHaveCount(6);

    $showResponse = $this->get(route('reports.naicom.show', [
        'reportRun' => $run,
        'form' => '7.2A',
    ]));

    $showResponse->assertStatus(200);
    $showResponse->assertInertia(fn ($page) => $page->component('reports/naicom/show'));
});

it('cleared cash receipts are excluded from cash in hand', function () {
    $monthEnd = now()->endOfMonth();

    Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurer_name' => $this->insurer->name,
        'effective_date' => now()->subMonths(2),
        'expiry_date' => now()->addMonths(10),
        'premium_amount' => 50000,
        'status' => 'active',
    ]);

    Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'payment_method' => 'cash',
        'payment_date' => $monthEnd->copy()->subDays(10),
        'amount_paid' => 30000,
        'is_cleared' => true,
        'cleared_at' => $monthEnd->copy()->subDays(5),
        'payment_status' => 'completed',
    ]);

    Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'payment_method' => 'cash',
        'payment_date' => $monthEnd->copy()->subDays(3),
        'amount_paid' => 7000,
        'is_cleared' => false,
        'cleared_at' => null,
        'payment_status' => 'completed',
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: now()->month <= 6 ? 'H1' : 'H2',
    );

    $currentMonth = now()->month;
    $row = collect($data['rows'])->firstWhere('month', $currentMonth);
    expect($row)->not->toBeNull();
    expect($row['cash_in_hand'])->toBe(7000.0);
});

it('receipts outside reporting period are excluded', function () {
    Policy::factory()->create([
        'tenant_id' => $this->tenant->id,
        'customer_id' => $this->customer->id,
        'insurer_name' => $this->insurer->name,
        'effective_date' => now()->subMonths(2),
        'expiry_date' => now()->addMonths(10),
        'premium_amount' => 50000,
        'status' => 'active',
    ]);

    Receipt::factory()->create([
        'tenant_id' => $this->tenant->id,
        'payment_method' => 'cash',
        'payment_date' => now()->subYear()->startOfYear()->subDay(),
        'amount_paid' => 999999,
        'is_cleared' => false,
        'payment_status' => 'completed',
    ]);

    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: 'H1',
    );

    foreach ($data['rows'] as $row) {
        expect($row['cash_in_hand'])->toBe(0.0);
    }
});

it('returns correct monthly summaries structure', function () {
    $data = $this->service->generateData(
        tenantId: $this->tenant->id,
        reportingYear: now()->year,
        reportingHalf: 'H1',
    );

    expect($data['monthly_summaries'])->toBeArray();
    expect($data['monthly_summaries'][0])->toHaveKeys([
        'month', 'month_name', 'total_assets', 'total_liabilities',
        'cash_in_hand', 'cheques_in_hand', 'bank_balance',
        'premium_awaiting_remittance', 'vat_awaiting_remittance',
    ]);
});
