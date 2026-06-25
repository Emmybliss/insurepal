<?php

use App\Models\NaicomReportLine;
use App\Models\NaicomReportRun;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Naicom\NaicomExcelExportService;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);

    collect([
        'naicom-reports.view', 'naicom-reports.export',
    ])->each(fn ($name) => Permission::create(['name' => $name, 'guard_name' => 'web']));

    $this->user->givePermissionTo('naicom-reports.view', 'naicom-reports.export');

    $this->actingAs($this->user);
});

it('exports form 7.2B spreadsheet', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'reporting_half' => 'H1',
        'reporting_year' => 2026,
    ]);

    NaicomReportLine::factory()->count(3)->create([
        'report_run_id' => $run->id,
        'form_type' => '7.2B',
        'month' => 1,
        'data' => [
            'customer_name' => 'Test Customer',
            'insurer_name' => 'Test Insurer',
            'cover_start' => '2026-01-01',
            'cover_end' => '2026-12-31',
            'sum_insured' => 1000000,
            'premium_direct_to_insurers' => 50000,
            'premium_to_broker_local' => 75000,
            'premium_to_broker_foreign' => 0,
            'total_gross_premium' => 125000,
            'net_premium' => 100000,
            'payment_method' => 'Transfer',
            'premium_received_by_broker' => 75000,
            'total_commission' => 25000,
            'co_broker_commission' => 5000,
            'reporting_broker_commission' => 20000,
            'commission_earned' => 15000,
            'commission_deferred' => 5000,
        ],
    ]);

    $service = app(NaicomExcelExportService::class);
    $path = $service->export($run, '7.2B', $this->user->id);

    expect(file_exists($path))->toBeTrue();

    $spreadsheet = IOFactory::load($path);
    $sheet = $spreadsheet->getActiveSheet();
    expect($sheet->getTitle())->toBe('7.2B');
    expect($sheet->getCell('A1')->getValue())->toContain('FORM 7.2B');

    $spreadsheet->disconnectWorksheets();
    @unlink($path);
});

it('exports form 7.2C spreadsheet', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'reporting_half' => 'H2',
        'reporting_year' => 2026,
    ]);

    NaicomReportLine::factory()->create([
        'report_run_id' => $run->id,
        'form_type' => '7.2C',
        'month' => 7,
        'data' => [
            'customer_name' => 'Test Insured',
            'policy_number' => 'POL-001',
            'insurer_name' => 'Test Insurer',
            'cover_start' => '2026-07-01',
            'cover_end' => '2027-06-30',
            'total_received' => 500000,
            'premium_due_to_insurers' => 450000,
            'deposit_made' => 0,
            'returned_premium_due' => 0,
            'claims_due_to_insured' => 0,
            'vat_due' => 37500,
            'commission_due_co_broker' => 5000,
            'commission_due_reporting_broker' => 7500,
            'remittance_date' => '2026-08-15',
            'bank_name' => 'ZENITH BANK PLC',
            'premium_remitted' => 400000,
            'claim_return_deposit_remitted' => 0,
            'vat_remitted' => 37500,
            'commission_remitted' => 10000,
            'outstanding_premium' => 50000,
            'outstanding_claim_return_deposit' => 0,
            'outstanding_vat' => 0,
            'outstanding_commission' => 2500,
        ],
    ]);

    $service = app(NaicomExcelExportService::class);
    $path = $service->export($run, '7.2C', $this->user->id);

    expect(file_exists($path))->toBeTrue();

    $spreadsheet = IOFactory::load($path);
    $sheet = $spreadsheet->getActiveSheet();
    expect($sheet->getTitle())->toBe('7.2C');
    expect($sheet->getCell('A1')->getValue())->toContain('FORM 7.2C');

    $spreadsheet->disconnectWorksheets();
    @unlink($path);
});

it('exports form 7.2A spreadsheet', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'reporting_half' => 'H1',
        'reporting_year' => 2026,
    ]);

    for ($i = 1; $i <= 3; $i++) {
        NaicomReportLine::factory()->create([
            'report_run_id' => $run->id,
            'form_type' => '7.2A',
            'row_number' => $i,
            'month' => 1,
            'data' => ['monthly' => [1000, 1100, 1200, 1300, 1400, 1500]],
        ]);
    }

    $service = app(NaicomExcelExportService::class);
    $path = $service->export($run, '7.2A', $this->user->id);

    expect(file_exists($path))->toBeTrue();

    $spreadsheet = IOFactory::load($path);
    $sheet = $spreadsheet->getActiveSheet();
    expect($sheet->getTitle())->toBe('7.2A');
    expect($sheet->getCell('A1')->getValue())->toContain('FORM 7.2A');

    $spreadsheet->disconnectWorksheets();
    @unlink($path);
});

it('records export metadata on the report run', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);

    NaicomReportLine::factory()->create([
        'report_run_id' => $run->id,
        'form_type' => '7.2B',
        'month' => 1,
    ]);

    $service = app(NaicomExcelExportService::class);
    $path = $service->export($run, '7.2B', $this->user->id);

    $run->refresh();
    $exports = $run->metadata['exports'] ?? [];
    expect($exports)->toHaveCount(1);
    expect($exports[0]['form'])->toBe('7.2B');
    expect($exports[0]['exported_by'])->toBe($this->user->id);
    expect($exports[0]['checksum'])->not->toBeEmpty();

    @unlink($path);
});

it('exports all three forms via the http endpoint', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'reporting_half' => 'H1',
        'reporting_year' => 2026,
        'status' => 'generated',
    ]);

    foreach (['7.2B', '7.2C', '7.2A'] as $form) {
        NaicomReportLine::factory()->create([
            'report_run_id' => $run->id,
            'form_type' => $form,
            'month' => 1,
            'data' => ['customer_name' => 'Test', 'insurer_name' => 'Test'],
        ]);
    }

    foreach (['xlsx-72b', 'xlsx-72c', 'xlsx-72a'] as $format) {
        $this->post(route('reports.naicom.export', [$run, 'format' => $format]))
            ->assertSuccessful();
    }
});

it('rejects export for unsupported format', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'status' => 'generated',
    ]);

    $this->post(route('reports.naicom.export', [$run, 'format' => 'pdf']))
        ->assertStatus(422);
});

it('generated file has correct numeric cell types', function () {
    $run = NaicomReportRun::factory()->create([
        'tenant_id' => $this->tenant->id,
        'reporting_half' => 'H1',
    ]);

    NaicomReportLine::factory()->create([
        'report_run_id' => $run->id,
        'form_type' => '7.2B',
        'month' => 1,
        'data' => [
            'customer_name' => 'Test',
            'insurer_name' => 'Test',
            'sum_insured' => 5000000.50,
            'total_gross_premium' => 125000.75,
        ],
    ]);

    $service = app(NaicomExcelExportService::class);
    $path = $service->export($run, '7.2B', $this->user->id);

    $spreadsheet = IOFactory::load($path);
    $sheet = $spreadsheet->getActiveSheet();

    expect($sheet->getCell('G7')->getValue())->toBeFloat();
    expect((float) $sheet->getCell('G7')->getValue())->toBe(5000000.50);
    expect((float) $sheet->getCell('K7')->getValue())->toBe(125000.75);

    $spreadsheet->disconnectWorksheets();
    @unlink($path);
});
