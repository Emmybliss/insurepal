<?php

namespace Tests\Feature;

use App\Models\Claim;
use App\Models\Customer;
use App\Models\InsuranceProduct;
use App\Models\Policy;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Exports\ExcelExportService;
use App\Services\Exports\PDFExportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExportTest extends TestCase
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

    public function test_excel_export_service_creates_file(): void
    {
        $this->createTestData();

        $excelService = app(ExcelExportService::class);
        $data = $this->getSampleReportData();

        $filepath = $excelService->exportReport('business-overview', $data, 'last_30_days');

        $this->assertFileExists($filepath);
        $this->assertStringEndsWith('.xlsx', $filepath);

        // Clean up
        if (file_exists($filepath)) {
            unlink($filepath);
        }
    }

    public function test_pdf_export_service_creates_file(): void
    {
        $this->createTestData();

        $pdfService = app(PDFExportService::class);
        $data = $this->getSampleReportData();

        $filepath = $pdfService->exportReport('business-overview', $data, 'last_30_days');

        $this->assertFileExists($filepath);
        $this->assertStringEndsWith('.pdf', $filepath);

        // Clean up
        if (file_exists($filepath)) {
            unlink($filepath);
        }
    }

    public function test_excel_export_naicom_report(): void
    {
        $this->createTestData();

        $excelService = app(ExcelExportService::class);
        $data = $this->getNaicomReportData();

        $filepath = $excelService->exportReport('naicom', $data, 'monthly');

        $this->assertFileExists($filepath);

        // Clean up
        if (file_exists($filepath)) {
            unlink($filepath);
        }
    }

    public function test_pdf_export_naicom_report(): void
    {
        $this->createTestData();

        $pdfService = app(PDFExportService::class);
        $data = $this->getNaicomReportData();

        $filepath = $pdfService->exportReport('naicom', $data, 'monthly');

        $this->assertFileExists($filepath);

        // Clean up
        if (file_exists($filepath)) {
            unlink($filepath);
        }
    }

    public function test_excel_export_customer_analytics(): void
    {
        $this->createTestData();

        $excelService = app(ExcelExportService::class);
        $data = $this->getCustomerAnalyticsData();

        $filepath = $excelService->exportReport('customer-analytics', $data, 'last_30_days');

        $this->assertFileExists($filepath);

        // Clean up
        if (file_exists($filepath)) {
            unlink($filepath);
        }
    }

    public function test_pdf_export_customer_analytics(): void
    {
        $this->createTestData();

        $pdfService = app(PDFExportService::class);
        $data = $this->getCustomerAnalyticsData();

        $filepath = $pdfService->exportReport('customer-analytics', $data, 'last_30_days');

        $this->assertFileExists($filepath);

        // Clean up
        if (file_exists($filepath)) {
            unlink($filepath);
        }
    }

    public function test_excel_export_product_performance(): void
    {
        $this->createTestData();

        $excelService = app(ExcelExportService::class);
        $data = $this->getProductPerformanceData();

        $filepath = $excelService->exportReport('product-performance', $data, 'last_30_days');

        $this->assertFileExists($filepath);

        // Clean up
        if (file_exists($filepath)) {
            unlink($filepath);
        }
    }

    public function test_pdf_export_product_performance(): void
    {
        $this->createTestData();

        $pdfService = app(PDFExportService::class);
        $data = $this->getProductPerformanceData();

        $filepath = $pdfService->exportReport('product-performance', $data, 'last_30_days');

        $this->assertFileExists($filepath);

        // Clean up
        if (file_exists($filepath)) {
            unlink($filepath);
        }
    }

    public function test_excel_export_claims_analytics(): void
    {
        $this->createTestData();

        $excelService = app(ExcelExportService::class);
        $data = $this->getClaimsAnalyticsData();

        $filepath = $excelService->exportReport('claims-analytics', $data, 'last_30_days');

        $this->assertFileExists($filepath);

        // Clean up
        if (file_exists($filepath)) {
            unlink($filepath);
        }
    }

    public function test_pdf_export_claims_analytics(): void
    {
        $this->createTestData();

        $pdfService = app(PDFExportService::class);
        $data = $this->getClaimsAnalyticsData();

        $filepath = $pdfService->exportReport('claims-analytics', $data, 'last_30_days');

        $this->assertFileExists($filepath);

        // Clean up
        if (file_exists($filepath)) {
            unlink($filepath);
        }
    }

    public function test_excel_export_financial_analytics(): void
    {
        $this->createTestData();

        $excelService = app(ExcelExportService::class);
        $data = $this->getFinancialAnalyticsData();

        $filepath = $excelService->exportReport('financial-analytics', $data, 'last_30_days');

        $this->assertFileExists($filepath);

        // Clean up
        if (file_exists($filepath)) {
            unlink($filepath);
        }
    }

    public function test_pdf_export_financial_analytics(): void
    {
        $this->createTestData();

        $pdfService = app(PDFExportService::class);
        $data = $this->getFinancialAnalyticsData();

        $filepath = $pdfService->exportReport('financial-analytics', $data, 'last_30_days');

        $this->assertFileExists($filepath);

        // Clean up
        if (file_exists($filepath)) {
            unlink($filepath);
        }
    }

    public function test_excel_export_compliance_dashboard(): void
    {
        $this->createTestData();

        $excelService = app(ExcelExportService::class);
        $data = $this->getComplianceDashboardData();

        $filepath = $excelService->exportReport('compliance-dashboard', $data, 'last_30_days');

        $this->assertFileExists($filepath);

        // Clean up
        if (file_exists($filepath)) {
            unlink($filepath);
        }
    }

    public function test_pdf_export_compliance_dashboard(): void
    {
        $this->createTestData();

        $pdfService = app(PDFExportService::class);
        $data = $this->getComplianceDashboardData();

        $filepath = $pdfService->exportReport('compliance-dashboard', $data, 'last_30_days');

        $this->assertFileExists($filepath);

        // Clean up
        if (file_exists($filepath)) {
            unlink($filepath);
        }
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

    protected function getSampleReportData(): array
    {
        return [
            'total_customers' => 100,
            'active_policies' => 150,
            'total_premium' => 5000000,
            'total_commission' => 250000,
        ];
    }

    protected function getNaicomReportData(): array
    {
        return [
            'company_info' => [
                'name' => 'Test Insurance Company',
                'registration_number' => 'RC123456',
                'license_number' => 'LIC789',
                'address' => '123 Test Street',
                'phone' => '+234123456789',
                'email' => 'test@company.com',
            ],
            'financial_summary' => [
                'gross_premium_written' => 10000000,
                'net_premium_written' => 9500000,
                'commission_paid' => 500000,
                'premium_refunded' => 100000,
                'outstanding_premiums' => 200000,
            ],
            'policy_stats' => collect([
                (object) [
                    'class_of_business' => 'Motor',
                    'product_name' => 'Comprehensive Motor',
                    'policy_count' => 50,
                    'total_premium' => 5000000,
                    'average_premium' => 100000,
                ],
            ]),
            'claims_data' => [
                'total_claims_reported' => 10,
                'total_claims_paid' => 500000,
                'total_claims_outstanding' => 100000,
                'claims_ratio' => 5.26,
            ],
            'customer_demographics' => [
                'individual_customers' => 80,
                'corporate_customers' => 20,
                'new_customers_period' => 15,
                'total_active_customers' => 95,
            ],
            'reinsurance_info' => [
                'facultative_premium_ceded' => 1000000,
                'treaty_premium_ceded' => 2000000,
                'commission_received' => 100000,
                'claims_recovered' => 50000,
            ],
        ];
    }

    protected function getCustomerAnalyticsData(): array
    {
        return [
            'total_customers' => 100,
            'new_customers' => 15,
            'individual_customers' => 80,
            'corporate_customers' => 20,
            'customers_with_policies' => 95,
            'customers_without_policies' => 5,
            'avg_policies_per_customer' => 1.5,
            'customer_retention_rate' => 85.0,
        ];
    }

    protected function getProductPerformanceData(): array
    {
        return [
            'total_products' => 3,
            'total_premium' => 10000000,
            'total_policies' => 150,
            'avg_premium_per_policy' => 66666.67,
            'total_commission' => 500000,
            'loss_ratio' => 60.0,
            'expense_ratio' => 25.0,
            'combined_ratio' => 85.0,
        ];
    }

    protected function getClaimsAnalyticsData(): array
    {
        return [
            'total_claims' => 25,
            'settled_claims' => 20,
            'pending_claims' => 3,
            'rejected_claims' => 2,
            'settlement_ratio' => 80.0,
            'average_claim_amount' => 50000,
            'total_claim_amount' => 1250000,
            'total_settled_amount' => 1000000,
        ];
    }

    protected function getFinancialAnalyticsData(): array
    {
        return [
            'total_revenue' => 10000000,
            'total_expenses' => 8500000,
            'net_profit' => 1500000,
            'loss_ratio' => 60.0,
            'expense_ratio' => 25.0,
            'combined_ratio' => 85.0,
            'profit_margin' => 15.0,
        ];
    }

    protected function getComplianceDashboardData(): array
    {
        return [
            'capital_adequacy_ratio' => 120.0,
            'rbc_ratio' => 115.0,
            'minimum_capital_requirement' => 10000000,
            'available_capital' => 12000000,
            'compliance_score' => 8.5,
            'outstanding_submissions' => 0,
            'upcoming_deadlines' => 2,
        ];
    }
}
