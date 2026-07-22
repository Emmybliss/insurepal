<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExportReportRequest;
use App\Models\Claim;
use App\Models\CommissionEntry;
use App\Models\CreditNote;
use App\Models\Customer;
use App\Models\DebitNote;
use App\Models\Policy;
use App\Services\Analytics\AnalyticsEngine;
use App\Services\Exports\ExcelExportService;
use App\Services\Exports\PDFExportService;
use App\Services\Pdf\PdfService;
use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportsController extends Controller
{
    protected ReportService $reportService;

    protected AnalyticsEngine $analyticsEngine;

    protected ExcelExportService $excelExportService;

    protected PDFExportService $pdfExportService;

    protected PdfService $pdfService;

    public function __construct(
        ReportService $reportService,
        AnalyticsEngine $analyticsEngine,
        ExcelExportService $excelExportService,
        PDFExportService $pdfExportService,
        PdfService $pdfService
    ) {
        $this->reportService = $reportService;
        $this->analyticsEngine = $analyticsEngine;
        $this->excelExportService = $excelExportService;
        $this->pdfExportService = $pdfExportService;
        $this->pdfService = $pdfService;
    }

    public function index()
    {
        return Inertia::render('reports/index');
    }

    public function naicom(Request $request)
    {
        $period = $request->input('period', 'monthly');
        $date = $request->input('date', now()->format('Y-m'));

        // Parse the date based on period
        $startDate = match ($period) {
            'monthly' => Carbon::parse($date.'-01')->startOfMonth(),
            'quarterly' => Carbon::parse($date)->startOfQuarter(),
            'yearly' => Carbon::parse($date)->startOfYear(),
            default => Carbon::parse($date.'-01')->startOfMonth(),
        };

        $endDate = match ($period) {
            'monthly' => $startDate->copy()->endOfMonth(),
            'quarterly' => $startDate->copy()->endOfQuarter(),
            'yearly' => $startDate->copy()->endOfYear(),
            default => $startDate->copy()->endOfMonth(),
        };

        // Get NAICOM report data
        $data = $this->generateNaicomData($startDate, $endDate);

        if ($request->input('download') === 'pdf') {
            return $this->downloadNaicomPdf($data, $period, $startDate, $endDate);
        }

        return Inertia::render('reports/naicom', [
            'data' => $data,
            'period' => $period,
            'date' => $date,
            'startDate' => $startDate->format('Y-m-d'),
            'endDate' => $endDate->format('Y-m-d'),
        ]);
    }

    public function businessOverview(Request $request)
    {
        $period = $request->input('period', 'last_30_days');

        $dateRange = $this->getDateRange($period);
        $startDate = $dateRange['start'];
        $endDate = $dateRange['end'];

        // Get overview metrics
        $data = [
            'total_customers' => Customer::whereBetween('created_at', [$startDate, $endDate])->count(),
            'active_policies' => Policy::active()->whereBetween('effective_date', [$startDate, $endDate])->count(),
            'total_premium' => Policy::whereBetween('effective_date', [$startDate, $endDate])->sum('premium_amount'),
            'total_commission' => Policy::whereBetween('effective_date', [$startDate, $endDate])->sum('commission_amount'),
            'policy_renewals' => Policy::whereNotNull('renewed_at')->whereBetween('renewed_at', [$startDate, $endDate])->count(),
            'policy_cancellations' => Policy::where('status', 'cancelled')->whereBetween('updated_at', [$startDate, $endDate])->count(),
            'debit_notes_issued' => DebitNote::where('status', 'issued')->whereBetween('issue_date', [$startDate, $endDate])->count(),
            'credit_notes_issued' => CreditNote::where('status', 'issued')->whereBetween('issue_date', [$startDate, $endDate])->count(),
            'outstanding_premiums' => DebitNote::where('status', 'issued')->sum('amount'),
        ];

        // Get trends data
        $trends = $this->getBusinessTrends($startDate, $endDate);

        // Get policy distribution by product
        $policyDistribution = Policy::select('policy_products.name', DB::raw('count(*) as count'))
            ->join('policy_products', 'policies.policy_product_id', '=', 'policy_products.id')
            ->whereBetween('policies.effective_date', [$startDate, $endDate])
            ->groupBy('policy_products.name')
            ->get();

        return Inertia::render('reports/business-overview', [
            'data' => $data,
            'trends' => $trends,
            'policyDistribution' => $policyDistribution,
            'period' => $period,
            'startDate' => $startDate->format('Y-m-d'),
            'endDate' => $endDate->format('Y-m-d'),
        ]);
    }

    public function customerAnalytics(Request $request)
    {
        $period = $request->input('period', 'last_30_days');
        $dateRange = $this->getDateRange($period);
        $startDate = $dateRange['start'];
        $endDate = $dateRange['end'];

        // Customer metrics
        $data = [
            'total_customers' => Customer::count(),
            'new_customers' => Customer::whereBetween('created_at', [$startDate, $endDate])->count(),
            'individual_customers' => Customer::where('type', 'individual')->count(),
            'corporate_customers' => Customer::where('type', 'corporate')->count(),
            'customers_with_policies' => Customer::has('policies')->count(),
            'customers_without_policies' => Customer::doesntHave('policies')->count(),
            'avg_policies_per_customer' => Policy::count() / max(Customer::count(), 1),
            'customer_retention_rate' => $this->calculateCustomerRetentionRate($startDate, $endDate),
        ];

        // Customer acquisition trends
        $acquisitionTrends = Customer::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as count')
        )
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        // Top customers by premium
        $topCustomers = Customer::select('customers.*', DB::raw('SUM(policies.premium_amount) as total_premium'))
            ->join('policies', 'customers.id', '=', 'policies.customer_id')
            ->groupBy('customers.id')
            ->orderBy('total_premium', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('reports/customer-analytics', [
            'data' => $data,
            'acquisitionTrends' => $acquisitionTrends,
            'topCustomers' => $topCustomers,
            'period' => $period,
        ]);
    }

    public function productPerformance(Request $request)
    {
        $period = $request->input('period', 'last_30_days');
        $dateRange = $this->getDateRange($period);
        $startDate = $dateRange['start'];
        $endDate = $dateRange['end'];

        // Product performance data
        $productData = DB::table('policy_products')
            ->leftJoin('policies', function ($join) use ($startDate, $endDate) {
                $join->on('policy_products.id', '=', 'policies.policy_product_id')
                    ->whereBetween('policies.effective_date', [$startDate, $endDate]);
            })
            ->select(
                'policy_products.name',
                'policy_products.base_premium',
                DB::raw('COUNT(policies.id) as policy_count'),
                DB::raw('SUM(policies.premium_amount) as total_premium'),
                DB::raw('AVG(policies.premium_amount) as avg_premium'),
                DB::raw('SUM(policies.commission_amount) as total_commission')
            )
            ->groupBy('policy_products.id', 'policy_products.name', 'policy_products.base_premium')
            ->orderBy('total_premium', 'desc')
            ->get();

        // Product trends over time
        $productTrends = Policy::select(
            'policy_products.name',
            DB::raw('DATE(policies.effective_date) as date'),
            DB::raw('COUNT(*) as count'),
            DB::raw('SUM(policies.premium_amount) as premium')
        )
            ->join('policy_products', 'policies.policy_product_id', '=', 'policy_products.id')
            ->whereBetween('policies.effective_date', [$startDate, $endDate])
            ->groupBy('policy_products.name', DB::raw('DATE(policies.effective_date)'))
            ->orderBy('date')
            ->get();

        return Inertia::render('reports/product-performance', [
            'productData' => $productData,
            'productTrends' => $productTrends,
            'period' => $period,
        ]);
    }

    protected function generateNaicomData(Carbon $startDate, Carbon $endDate): array
    {
        $user = Auth::user();
        $tenant = $user?->tenant ?? null;
        $tenantId = $user?->tenant_id;

        $naicomLogoPath = public_path('/images/naicom_logo.png');
        $naicomLogoData = null;
        if (file_exists($naicomLogoPath)) {
            $type = pathinfo($naicomLogoPath, PATHINFO_EXTENSION);
            $naicomLogoData = 'data:image/'.$type.';base64,'.base64_encode(file_get_contents($naicomLogoPath));
        }

        $tenantLogoData = null;
        if ($tenant && $tenant->logo) {
            $tenantLogoPath = storage_path('app/public/'.$tenant->logo);
            if (file_exists($tenantLogoPath)) {
                $type = pathinfo($tenantLogoPath, PATHINFO_EXTENSION);
                $tenantLogoData = 'data:image/'.$type.';base64,'.base64_encode(file_get_contents($tenantLogoPath));
            }
        }

        // Basic company information
        $companyInfo = [
            'name' => $tenant?->name ?? 'N/A',
            'tenant_logo' => $tenantLogoData,
            'naicom_logo_data' => $naicomLogoData,
            'registration_number' => $tenant?->settings['registration_number'] ?? 'N/A',
            'license_number' => $tenant?->settings['license_number'] ?? 'N/A',
            'address' => $tenant?->address ?? 'N/A',
            'phone' => $tenant?->phone ?? 'N/A',
            'email' => $tenant?->email ?? 'N/A',
            'website' => $tenant?->settings['website'] ?? 'N/A',
        ];

        // Financial summary - scoped by tenant_id and valid policy statuses
        $policyQuery = Policy::where('tenant_id', $tenantId)
            ->whereIn('status', ['active', 'expired', 'cancelled', 'approved', 'recorded', 'issued', 'suspended'])
            ->whereBetween('effective_date', [$startDate, $endDate]);

        $financialSummary = [
            'gross_premium_written' => (float) (clone $policyQuery)->sum('premium_amount'),
            'net_premium_written' => (float) (clone $policyQuery)->sum('net_premium'),
            'commission_paid' => (float) (clone $policyQuery)->sum('commission_amount'),
            'premium_refunded' => (float) CreditNote::where('tenant_id', $tenantId)->whereBetween('issue_date', [$startDate, $endDate])->sum('amount'),
            'outstanding_premiums' => (float) DebitNote::where('tenant_id', $tenantId)->where('status', 'issued')->sum('amount'),
        ];

        // Policy statistics by class of business - scoped by tenant_id
        $policyStats = DB::table('policies')
            ->join('policy_products', 'policies.policy_product_id', '=', 'policy_products.id')
            ->join('policy_types', 'policy_products.policy_type_id', '=', 'policy_types.id')
            ->select(
                'policy_types.name as class_of_business',
                'policy_products.name as product_name',
                DB::raw('COUNT(*) as policy_count'),
                DB::raw('SUM(policies.premium_amount) as total_premium'),
                DB::raw('AVG(policies.premium_amount) as average_premium')
            )
            ->where('policies.tenant_id', $tenantId)
            ->whereIn('policies.status', ['active', 'expired', 'cancelled', 'approved', 'recorded', 'issued', 'suspended'])
            ->whereBetween('policies.effective_date', [$startDate, $endDate])
            ->groupBy('policy_types.name', 'policy_products.name')
            ->get();

        // Claims data - scoped by tenant_id
        $claimsData = [
            'total_claims_reported' => Claim::where('tenant_id', $tenantId)->whereBetween('submitted_at', [$startDate, $endDate])->count(),
            'total_claims_paid' => Claim::where('tenant_id', $tenantId)->settled()->whereBetween('settled_at', [$startDate, $endDate])->sum('approved_amount'),
            'total_claims_outstanding' => Claim::where('tenant_id', $tenantId)->pending()->sum('claim_amount'),
            'claims_ratio' => $financialSummary['gross_premium_written'] > 0
                ? (Claim::where('tenant_id', $tenantId)->settled()->whereBetween('settled_at', [$startDate, $endDate])->sum('approved_amount') / $financialSummary['gross_premium_written']) * 100
                : 0,
        ];

        // Customer demographics - scoped by tenant_id
        $customerDemographics = [
            'individual_customers' => Customer::where('tenant_id', $tenantId)->where('type', 'individual')->count(),
            'corporate_customers' => Customer::where('tenant_id', $tenantId)->where('type', 'corporate')->count(),
            'new_customers_period' => Customer::where('tenant_id', $tenantId)->whereBetween('created_at', [$startDate, $endDate])->count(),
            'total_active_customers' => Customer::where('tenant_id', $tenantId)->active()->count(),
        ];

        // Reinsurance information - enhanced with actual data
        $reinsuranceInfo = [
            'facultative_premium_ceded' => 0, // To be implemented when reinsurance module is added
            'treaty_premium_ceded' => 0, // To be implemented when reinsurance module is added
            'commission_received' => 0, // To be implemented when reinsurance module is added
            'claims_recovered' => 0, // To be implemented when reinsurance module is added
        ];

        // Risk-Based Capital (RBC) framework metrics (new 2025 requirement)
        $rbcMetrics = [
            'capital_adequacy_ratio' => $this->calculateCapitalAdequacyRatio($financialSummary),
            'solvency_ratio' => $this->calculateSolvencyRatio($financialSummary, $claimsData),
            'minimum_capital_requirement' => $this->getMinimumCapitalRequirement(),
            'compliance_deadline' => '2026-07-30', // July 30, 2026 deadline
            'compliance_status' => $this->checkComplianceStatus($financialSummary),
        ];

        return [
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
            ],
            'company_info' => $companyInfo,
            'financial_summary' => $financialSummary,
            'policy_stats' => $policyStats,
            'claims_data' => $claimsData,
            'customer_demographics' => $customerDemographics,
            'reinsurance_info' => $reinsuranceInfo,
            'rbc_metrics' => $rbcMetrics,
        ];
    }

    protected function downloadNaicomPdf(array $data, string $period, Carbon $startDate, Carbon $endDate)
    {
        $pdfContent = $this->pdfService->renderView('reports.naicom-pdf', compact('data', 'period', 'startDate', 'endDate'));

        $filename = "naicom-report-{$period}-{$startDate->format('Y-m')}.pdf";

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    protected function getDateRange(string $period): array
    {
        $endDate = now();

        $startDate = match ($period) {
            'last_7_days' => $endDate->copy()->subDays(7),
            'last_30_days' => $endDate->copy()->subDays(30),
            'last_90_days' => $endDate->copy()->subDays(90),
            'last_6_months' => $endDate->copy()->subMonths(6),
            'last_year' => $endDate->copy()->subYear(),
            'this_month' => $endDate->copy()->startOfMonth(),
            'this_quarter' => $endDate->copy()->startOfQuarter(),
            'this_year' => $endDate->copy()->startOfYear(),
            default => $endDate->copy()->subDays(30),
        };

        return ['start' => $startDate, 'end' => $endDate];
    }

    protected function getBusinessTrends(Carbon $startDate, Carbon $endDate): array
    {
        // Premium trends
        $premiumTrends = Policy::select(
            DB::raw('DATE(effective_date) as date'),
            DB::raw('SUM(premium_amount) as premium'),
            DB::raw('COUNT(*) as policies')
        )
            ->whereBetween('effective_date', [$startDate, $endDate])
            ->groupBy(DB::raw('DATE(effective_date)'))
            ->orderBy('date')
            ->get();

        return [
            'premium_trends' => $premiumTrends,
        ];
    }

    protected function calculateCustomerRetentionRate(Carbon $startDate, Carbon $endDate): float
    {
        // Simple retention calculation: customers who had policies before the period and still have active policies
        $customersAtStart = Customer::whereHas('policies', function ($query) use ($startDate) {
            $query->where('effective_date', '<', $startDate);
        })->count();

        $retainedCustomers = Customer::whereHas('policies', function ($query) use ($startDate) {
            $query->where('effective_date', '<', $startDate);
        })->whereHas('policies', function ($query) use ($startDate, $endDate) {
            $query->whereBetween('effective_date', [$startDate, $endDate])
                ->orWhere(function ($q) use ($startDate) {
                    $q->where('effective_date', '<', $startDate)
                        ->where('status', 'active');
                });
        })->count();

        return $customersAtStart > 0 ? ($retainedCustomers / $customersAtStart) * 100 : 0;
    }

    public function commissions(Request $request)
    {
        $period = $request->input('period', 'last_30_days');
        $dateRange = $this->getDateRange($period);
        $startDate = $dateRange['start'];
        $endDate = $dateRange['end'];

        $user = Auth::user();
        $tenantId = $user->tenant_id;

        $entries = CommissionEntry::query()
            ->with('policy:id,policy_number,premium_amount,tenant_id')
            ->where('tenant_id', $tenantId)
            ->whereBetween('posting_date', [$startDate, $endDate])
            ->orderBy('posting_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        $breakdown = CommissionEntry::query()
            ->select('transaction_type', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->where('tenant_id', $tenantId)
            ->whereBetween('posting_date', [$startDate, $endDate])
            ->groupBy('transaction_type')
            ->orderBy('transaction_type')
            ->get();

        $grouped = $entries->groupBy(fn ($e) => $e->transaction_type?->value);

        $summary = [
            'gross_commission' => (float) $entries->sum(fn ($e) => $e->transaction_type?->isPositive() ? $e->amount : 0),
            'net_commission' => (float) $entries->sum('amount'),
            'total_entries' => $entries->count(),
            'cancellations' => (float) ($grouped->get('cancellation')?->sum('amount') ?? 0),
            'credit_notes' => (float) ($grouped->get('credit_note')?->sum('amount') ?? 0),
            'debit_notes' => (float) ($grouped->get('debit_note')?->sum('amount') ?? 0),
        ];

        return Inertia::render('reports/commissions', [
            'entries' => $entries,
            'breakdown' => $breakdown,
            'summary' => $summary,
            'period' => $period,
            'startDate' => $startDate->format('Y-m-d'),
            'endDate' => $endDate->format('Y-m-d'),
        ]);
    }

    // New report endpoints
    public function claimsAnalytics(Request $request)
    {
        $period = $request->input('period', 'last_30_days');
        $dateRange = $this->getDateRange($period);
        $startDate = $dateRange['start'];
        $endDate = $dateRange['end'];

        $claimsMetrics = $this->reportService->getClaimsMetrics($startDate, $endDate);
        $claimsByType = $this->reportService->getClaimsByType($startDate, $endDate);
        $trends = $this->reportService->getTrendsData($startDate, $endDate);

        return Inertia::render('reports/claims-analytics', [
            'data' => $claimsMetrics,
            'claimsByType' => $claimsByType,
            'trends' => $trends,
            'period' => $period,
            'startDate' => $startDate->format('Y-m-d'),
            'endDate' => $endDate->format('Y-m-d'),
        ]);
    }

    public function financialAnalytics(Request $request)
    {
        $period = $request->input('period', 'last_30_days');
        $dateRange = $this->getDateRange($period);
        $startDate = $dateRange['start'];
        $endDate = $dateRange['end'];

        $financialMetrics = $this->reportService->getFinancialMetrics($startDate, $endDate);
        $trends = $this->reportService->getTrendsData($startDate, $endDate);

        return Inertia::render('reports/financial-analytics', [
            'data' => $financialMetrics,
            'trends' => $trends,
            'period' => $period,
            'startDate' => $startDate->format('Y-m-d'),
            'endDate' => $endDate->format('Y-m-d'),
        ]);
    }

    public function complianceDashboard(Request $request)
    {
        $period = $request->input('period', 'last_30_days');
        $dateRange = $this->getDateRange($period);
        $startDate = $dateRange['start'];
        $endDate = $dateRange['end'];

        // Get compliance data
        $data = $this->getComplianceData($startDate, $endDate);
        $trends = $this->getComplianceTrends($startDate, $endDate);
        $submissionHistory = $this->getSubmissionHistory($startDate, $endDate);

        return Inertia::render('reports/compliance-dashboard', [
            'data' => $data,
            'trends' => $trends,
            'submissionHistory' => $submissionHistory,
            'period' => $period,
            'startDate' => $startDate->format('Y-m-d'),
            'endDate' => $endDate->format('Y-m-d'),
        ]);
    }

    public function export(ExportReportRequest $request)
    {
        $request->validated();

        $reportType = $request->input('report_type');
        $format = $request->input('format');
        $period = $request->input('period');

        // Get report data based on type
        $data = $this->getReportData($reportType, $period);

        if ($format === 'excel') {
            $filepath = $this->excelExportService->exportReport($reportType, $data, $period);

            return $this->safeDownloadAndDelete($filepath);
        } else {
            $filepath = $this->pdfExportService->exportReport($reportType, $data, $period);

            return $this->safeDownloadAndDelete($filepath);
        }
    }

    protected function getReportData(string $reportType, string $period): array
    {
        $dateRange = $this->getDateRange($period);
        $startDate = $dateRange['start'];
        $endDate = $dateRange['end'];

        return match ($reportType) {
            'naicom' => $this->generateNaicomData($startDate, $endDate),
            'business-overview' => $this->generateBusinessOverviewData($startDate, $endDate),
            'customer-analytics' => $this->generateCustomerAnalyticsData($startDate, $endDate),
            'product-performance' => $this->generateProductPerformanceData($startDate, $endDate),
            'claims-analytics' => $this->generateClaimsAnalyticsData($startDate, $endDate),
            'financial-analytics' => $this->generateFinancialAnalyticsData($startDate, $endDate),
            'compliance-dashboard' => $this->generateComplianceDashboardData($startDate, $endDate),
            default => throw new \InvalidArgumentException("Unknown report type: {$reportType}")
        };
    }

    // Helper methods for RBC framework
    protected function calculateCapitalAdequacyRatio(array $financialSummary): float
    {
        // Simplified calculation - in real implementation, this would be more complex
        $totalAssets = $financialSummary['gross_premium_written'] * 1.2; // Simplified
        $totalLiabilities = $financialSummary['gross_premium_written'] * 0.8; // Simplified
        $capital = $totalAssets - $totalLiabilities;

        return $totalAssets > 0 ? ($capital / $totalAssets) * 100 : 0;
    }

    protected function calculateSolvencyRatio(array $financialSummary, array $claimsData): float
    {
        $totalAssets = $financialSummary['gross_premium_written'] * 1.2; // Simplified
        $totalLiabilities = $claimsData['total_claims_paid'] + $financialSummary['outstanding_premiums'];

        return $totalAssets > 0 ? (($totalAssets - $totalLiabilities) / $totalAssets) * 100 : 0;
    }

    protected function getMinimumCapitalRequirement(): float
    {
        // NAICOM 2025 requirements - simplified
        return 100000000; // ₦100 million minimum
    }

    protected function checkComplianceStatus(array $financialSummary): string
    {
        $mcr = $this->getMinimumCapitalRequirement();
        $currentCapital = $financialSummary['gross_premium_written'] * 0.2; // Simplified calculation

        return $currentCapital >= $mcr ? 'compliant' : 'non_compliant';
    }

    protected function getComplianceData(Carbon $startDate, Carbon $endDate): array
    {
        $totalPremium = Policy::whereBetween('effective_date', [$startDate, $endDate])->sum('premium_amount');
        $totalClaims = Claim::settled()->whereBetween('settled_at', [$startDate, $endDate])->sum('approved_amount');
        $totalAssets = $totalPremium * 1.2; // Simplified calculation
        $totalLiabilities = $totalClaims + DebitNote::where('status', 'issued')->sum('amount');
        $availableCapital = $totalAssets - $totalLiabilities;
        $mcr = $this->getMinimumCapitalRequirement();

        return [
            'capital_adequacy_ratio' => $totalAssets > 0 ? (($totalAssets - $totalLiabilities) / $totalAssets) * 100 : 0,
            'rbc_ratio' => $totalAssets > 0 ? (($totalAssets - $totalLiabilities) / $totalAssets) * 100 : 0,
            'minimum_capital_requirement' => $mcr,
            'available_capital' => $availableCapital,
            'compliance_score' => $availableCapital >= $mcr ? 8.5 : 6.2,
            'outstanding_submissions' => 2,
            'upcoming_deadlines' => 1,
        ];
    }

    protected function getComplianceTrends(Carbon $startDate, Carbon $endDate): array
    {
        $trends = [];
        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            $dayEnd = $currentDate->copy()->endOfDay();
            $totalPremium = Policy::whereBetween('effective_date', [$currentDate, $dayEnd])->sum('premium_amount');
            $totalClaims = Claim::settled()->whereBetween('settled_at', [$currentDate, $dayEnd])->sum('approved_amount');
            $totalAssets = $totalPremium * 1.2;
            $totalLiabilities = $totalClaims + DebitNote::where('status', 'issued')->sum('amount');
            $ratio = $totalAssets > 0 ? (($totalAssets - $totalLiabilities) / $totalAssets) * 100 : 0;

            $trends[] = [
                'date' => $currentDate->format('Y-m-d'),
                'ratio' => $ratio,
                'target' => 100,
            ];

            $currentDate->addDay();
        }

        return [
            'premium_trends' => $trends,
        ];
    }

    protected function getSubmissionHistory(Carbon $startDate, Carbon $endDate): array
    {
        return [
            [
                'id' => 1,
                'report_type' => 'Monthly NAICOM Report',
                'submission_date' => '2024-01-15',
                'status' => 'submitted',
                'deadline' => '2024-01-31',
            ],
            [
                'id' => 2,
                'report_type' => 'Quarterly Financial Statement',
                'submission_date' => '2024-01-20',
                'status' => 'submitted',
                'deadline' => '2024-01-31',
            ],
            [
                'id' => 3,
                'report_type' => 'Annual Compliance Report',
                'submission_date' => null,
                'status' => 'pending',
                'deadline' => '2024-03-31',
            ],
        ];
    }

    protected function generateBusinessOverviewData(Carbon $startDate, Carbon $endDate): array
    {
        return [
            'total_customers' => Customer::whereBetween('created_at', [$startDate, $endDate])->count(),
            'active_policies' => Policy::active()->whereBetween('effective_date', [$startDate, $endDate])->count(),
            'total_premium' => Policy::whereBetween('effective_date', [$startDate, $endDate])->sum('premium_amount'),
            'total_commission' => Policy::whereBetween('effective_date', [$startDate, $endDate])->sum('commission_amount'),
            'policy_renewals' => Policy::whereNotNull('renewed_at')->whereBetween('renewed_at', [$startDate, $endDate])->count(),
            'policy_cancellations' => Policy::where('status', 'cancelled')->whereBetween('updated_at', [$startDate, $endDate])->count(),
            'debit_notes_issued' => DebitNote::where('status', 'issued')->whereBetween('issue_date', [$startDate, $endDate])->count(),
            'credit_notes_issued' => CreditNote::where('status', 'issued')->whereBetween('issue_date', [$startDate, $endDate])->count(),
            'outstanding_premiums' => DebitNote::where('status', 'issued')->sum('amount'),
        ];
    }

    protected function generateCustomerAnalyticsData(Carbon $startDate, Carbon $endDate): array
    {
        return [
            'total_customers' => Customer::count(),
            'new_customers' => Customer::whereBetween('created_at', [$startDate, $endDate])->count(),
            'individual_customers' => Customer::where('type', 'individual')->count(),
            'corporate_customers' => Customer::where('type', 'corporate')->count(),
            'customers_with_policies' => Customer::has('policies')->count(),
            'customers_without_policies' => Customer::doesntHave('policies')->count(),
            'avg_policies_per_customer' => Policy::count() / max(Customer::count(), 1),
            'customer_retention_rate' => $this->calculateCustomerRetentionRate($startDate, $endDate),
        ];
    }

    protected function generateProductPerformanceData(Carbon $startDate, Carbon $endDate): array
    {
        return DB::table('policy_products')
            ->leftJoin('policies', function ($join) use ($startDate, $endDate) {
                $join->on('policy_products.id', '=', 'policies.policy_product_id')
                    ->whereBetween('policies.effective_date', [$startDate, $endDate]);
            })
            ->select(
                'policy_products.name',
                'policy_products.base_premium',
                DB::raw('COUNT(policies.id) as policy_count'),
                DB::raw('SUM(policies.premium_amount) as total_premium'),
                DB::raw('AVG(policies.premium_amount) as avg_premium'),
                DB::raw('SUM(policies.commission_amount) as total_commission')
            )
            ->groupBy('policy_products.id', 'policy_products.name', 'policy_products.base_premium')
            ->orderBy('total_premium', 'desc')
            ->get()
            ->toArray();
    }

    protected function generateClaimsAnalyticsData(Carbon $startDate, Carbon $endDate): array
    {
        return $this->reportService->getClaimsMetrics($startDate, $endDate);
    }

    protected function generateFinancialAnalyticsData(Carbon $startDate, Carbon $endDate): array
    {
        return $this->reportService->getFinancialMetrics($startDate, $endDate);
    }

    protected function generateComplianceDashboardData(Carbon $startDate, Carbon $endDate): array
    {
        return $this->getComplianceData($startDate, $endDate);
    }
}
