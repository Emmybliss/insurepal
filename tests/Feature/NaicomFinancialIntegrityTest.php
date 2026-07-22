<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\DebitNote;
use App\Models\NaicomReportRun;
use App\Models\Policy;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Naicom\NaicomForm72AService;
use App\Services\Naicom\NaicomForm72BService;
use App\Services\Naicom\NaicomForm72CService;
use App\Services\Naicom\NaicomReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NaicomFinancialIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create(['naicom_reg_number' => 'NAICOM/BRK/12345']);
        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);

        $this->actingAs($this->user);
    }

    public function test_form_72a_balance_sheet_assets_and_liabilities_reconciliation(): void
    {
        $service = app(NaicomForm72AService::class);

        $data = $service->generateData(
            tenantId: $this->tenant->id,
            reportingYear: 2026,
            reportingHalf: 'H1',
        );

        $this->assertIsArray($data['rows']);
        $this->assertCount(6, $data['rows']);

        foreach ($data['rows'] as $row) {
            $totalAssets = $row['cash_in_hand'] + $row['cheques_in_hand'] + $row['bank_balance'];
            $this->assertEquals($row['total_assets'], round($totalAssets, 2));

            $totalLiabilities = $row['premium_awaiting_remittance']
                + $row['commission_co_broker_awaiting']
                + $row['commission_reporting_broker_awaiting']
                + $row['vat_awaiting_remittance']
                + $row['others'];

            $this->assertEquals($row['total_liabilities'], round($totalLiabilities, 2));
        }
    }

    public function test_form_72b_gross_premium_uses_contractual_debit_note_amount(): void
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $policy = Policy::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'effective_date' => '2026-02-01',
            'expiry_date' => '2027-01-31',
            'premium_amount' => 500000.00,
            'status' => 'active',
        ]);

        DebitNote::create([
            'note_number' => 'DN-2026-000001',
            'reference_number' => 'REF-2026-000001',
            'sequence_number' => 1,
            'tenant_id' => $this->tenant->id,
            'policy_id' => $policy->id,
            'customer_id' => $customer->id,
            'amount' => 500000.00,
            'total_amount' => 500000.00,
            'description' => 'Test Debit Note',
            'status' => 'issued',
            'created_by_id' => $this->user->id,
        ]);

        $service = app(NaicomForm72BService::class);

        $data = $service->generateData(
            tenantId: $this->tenant->id,
            reportingYear: 2026,
            reportingHalf: 'H1',
        );

        $this->assertNotEmpty($data['rows']);
        $row = collect($data['rows'])->firstWhere('policy_id', $policy->id);

        $this->assertNotNull($row);
        $this->assertEquals(500000.00, $row['total_gross_premium']);
    }

    public function test_form_72c_outstanding_premium_calculation_integrity(): void
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $policy = Policy::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'effective_date' => '2026-03-01',
            'expiry_date' => '2027-02-28',
            'premium_amount' => 200000.00,
            'status' => 'active',
        ]);

        $service = app(NaicomForm72CService::class);

        $data = $service->generateData(
            tenantId: $this->tenant->id,
            reportingYear: 2026,
            reportingHalf: 'H1',
        );

        $this->assertNotEmpty($data['rows']);
        $row = collect($data['rows'])->firstWhere('policy_id', $policy->id);

        $this->assertNotNull($row);
        $expectedOutstanding = max(0, $row['premium_due_to_insurers'] - $row['premium_remitted']);
        $this->assertEquals($expectedOutstanding, $row['outstanding_premium']);
    }

    public function test_naicom_report_service_enforces_strict_tenant_isolation(): void
    {
        $otherTenant = Tenant::factory()->create(['naicom_reg_number' => 'NAICOM/BRK/99999']);
        $otherCustomer = Customer::factory()->create(['tenant_id' => $otherTenant->id]);

        Policy::factory()->create([
            'tenant_id' => $otherTenant->id,
            'customer_id' => $otherCustomer->id,
            'effective_date' => '2026-01-15',
            'expiry_date' => '2027-01-14',
            'premium_amount' => 1000000.00,
            'status' => 'active',
        ]);

        $run = NaicomReportRun::create([
            'tenant_id' => $this->tenant->id,
            'reporting_year' => 2026,
            'reporting_half' => 'H1',
            'generated_by' => $this->user->id,
        ]);

        $reportService = app(NaicomReportService::class);
        $reportService->generate($run);

        $lines = $run->lines()->get();

        foreach ($lines as $line) {
            $data = $line->data;
            if (isset($data['customer_id'])) {
                $this->assertNotEquals($otherCustomer->id, $data['customer_id']);
            }
        }
    }
}
