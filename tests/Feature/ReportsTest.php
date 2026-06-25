<?php

namespace Tests\Feature;

use App\Models\Claim;
use App\Models\Customer;
use App\Models\InsuranceProduct;
use App\Models\Policy;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportsTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);

        $this->actingAs($this->user);
    }

    public function test_reports_index_page_loads(): void
    {
        $response = $this->get('/reports');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('reports/index'));
    }

    public function test_naicom_report_generates_successfully(): void
    {
        // Create test data
        $this->createTestData();

        $response = $this->get('/reports/naicom?period=monthly&date='.now()->format('Y-m'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('reports/naicom')
            ->has('data')
            ->has('period')
            ->has('startDate')
            ->has('endDate')
        );
    }

    public function test_business_overview_report_generates_successfully(): void
    {
        $this->createTestData();

        $response = $this->get('/reports/business-overview?period=last_30_days');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('reports/business-overview')
            ->has('data')
            ->has('trends')
            ->has('policyDistribution')
        );
    }

    public function test_customer_analytics_report_generates_successfully(): void
    {
        $this->createTestData();

        $response = $this->get('/reports/customer-analytics?period=last_30_days');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('reports/customer-analytics')
            ->has('data')
            ->has('acquisitionTrends')
            ->has('topCustomers')
        );
    }

    public function test_product_performance_report_generates_successfully(): void
    {
        $this->createTestData();

        $response = $this->get('/reports/product-performance?period=last_30_days');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('reports/product-performance')
            ->has('data')
            ->has('productPerformance')
            ->has('trends')
        );
    }

    public function test_claims_analytics_report_generates_successfully(): void
    {
        $this->createTestData();

        $response = $this->get('/reports/claims-analytics?period=last_30_days');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('reports/claims-analytics')
            ->has('data')
            ->has('claimsByType')
            ->has('trends')
        );
    }

    public function test_financial_analytics_report_generates_successfully(): void
    {
        $this->createTestData();

        $response = $this->get('/reports/financial-analytics?period=last_30_days');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('reports/financial-analytics')
            ->has('data')
            ->has('trends')
        );
    }

    public function test_compliance_dashboard_report_generates_successfully(): void
    {
        $this->createTestData();

        $response = $this->get('/reports/compliance-dashboard?period=last_30_days');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('reports/compliance-dashboard')
            ->has('data')
            ->has('trends')
            ->has('submissionHistory')
        );
    }

    public function test_export_pdf_functionality(): void
    {
        $this->createTestData();

        $response = $this->post('/reports/export', [
            'report_type' => 'business-overview',
            'format' => 'pdf',
            'period' => 'last_30_days',
        ]);

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_export_excel_functionality(): void
    {
        $this->createTestData();

        $response = $this->post('/reports/export', [
            'report_type' => 'business-overview',
            'format' => 'excel',
            'period' => 'last_30_days',
        ]);

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_export_validation(): void
    {
        $response = $this->post('/reports/export', [
            'report_type' => 'invalid-report',
            'format' => 'invalid-format',
            'period' => 'invalid-period',
        ]);

        $response->assertStatus(422);
    }

    public function test_naicom_report_includes_rbc_metrics(): void
    {
        $this->createTestData();

        $response = $this->get('/reports/naicom?period=monthly&date='.now()->format('Y-m'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->has('data.rbc_ratio')
            ->has('data.capital_adequacy_ratio')
            ->has('data.minimum_capital_requirement')
        );
    }

    public function test_business_overview_includes_kpis(): void
    {
        $this->createTestData();

        $response = $this->get('/reports/business-overview?period=last_30_days');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->has('data.total_customers')
            ->has('data.active_policies')
            ->has('data.total_premium')
            ->has('data.total_commission')
        );
    }

    public function test_customer_analytics_includes_segmentation(): void
    {
        $this->createTestData();

        $response = $this->get('/reports/customer-analytics?period=last_30_days');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->has('data.individual_customers')
            ->has('data.corporate_customers')
            ->has('data.customer_retention_rate')
        );
    }

    public function test_product_performance_includes_profitability(): void
    {
        $this->createTestData();

        $response = $this->get('/reports/product-performance?period=last_30_days');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->has('data.loss_ratio')
            ->has('data.expense_ratio')
            ->has('data.combined_ratio')
        );
    }

    public function test_claims_analytics_includes_processing_metrics(): void
    {
        $this->createTestData();

        $response = $this->get('/reports/claims-analytics?period=last_30_days');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->has('data.settlement_ratio')
            ->has('data.average_claim_amount')
            ->has('data.total_claims')
        );
    }

    public function test_financial_analytics_includes_ratios(): void
    {
        $this->createTestData();

        $response = $this->get('/reports/financial-analytics?period=last_30_days');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->has('data.loss_ratio')
            ->has('data.expense_ratio')
            ->has('data.combined_ratio')
            ->has('data.profit_margin')
        );
    }

    public function test_compliance_dashboard_includes_capital_metrics(): void
    {
        $this->createTestData();

        $response = $this->get('/reports/compliance-dashboard?period=last_30_days');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->has('data.capital_adequacy_ratio')
            ->has('data.rbc_ratio')
            ->has('data.available_capital')
            ->has('data.compliance_score')
        );
    }

    protected function createTestData(): void
    {
        // Create insurance products
        $products = InsuranceProduct::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create customers
        $customers = Customer::factory()->count(10)->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create policies
        foreach ($customers as $customer) {
            Policy::factory()->count(rand(1, 3))->create([
                'customer_id' => $customer->id,
                'insurance_product_id' => $products->random()->id,
                'tenant_id' => $this->tenant->id,
            ]);
        }

        // Create claims
        $policies = Policy::where('tenant_id', $this->tenant->id)->get();
        foreach ($policies->take(5) as $policy) {
            Claim::factory()->create([
                'policy_id' => $policy->id,
                'tenant_id' => $this->tenant->id,
            ]);
        }
    }
}
