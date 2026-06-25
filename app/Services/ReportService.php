<?php

namespace App\Services;

use App\Models\Claim;
use App\Models\Customer;
use App\Models\FinancialNote;
use App\Models\Policy;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function getBusinessMetrics(Carbon $startDate, Carbon $endDate): array
    {
        return [
            'total_customers' => Customer::whereBetween('created_at', [$startDate, $endDate])->count(),
            'active_policies' => Policy::active()->whereBetween('effective_date', [$startDate, $endDate])->count(),
            'total_premium' => Policy::whereBetween('effective_date', [$startDate, $endDate])->sum('premium_amount'),
            'total_commission' => Policy::whereBetween('effective_date', [$startDate, $endDate])->sum('commission_amount'),
            'policy_renewals' => Policy::whereNotNull('renewed_at')->whereBetween('renewed_at', [$startDate, $endDate])->count(),
            'policy_cancellations' => Policy::where('status', 'cancelled')->whereBetween('updated_at', [$startDate, $endDate])->count(),
            'debit_notes_issued' => FinancialNote::debit()->issued()->whereBetween('issue_date', [$startDate, $endDate])->count(),
            'credit_notes_issued' => FinancialNote::credit()->issued()->whereBetween('issue_date', [$startDate, $endDate])->count(),
            'outstanding_premiums' => FinancialNote::debit()->issued()->sum('amount'),
        ];
    }

    public function getClaimsMetrics(Carbon $startDate, Carbon $endDate): array
    {
        $totalClaims = Claim::whereBetween('submitted_at', [$startDate, $endDate])->count();
        $settledClaims = Claim::settled()->whereBetween('settled_at', [$startDate, $endDate])->count();
        $pendingClaims = Claim::pending()->count();
        $rejectedClaims = Claim::rejected()->whereBetween('rejected_at', [$startDate, $endDate])->count();

        return [
            'total_claims' => $totalClaims,
            'settled_claims' => $settledClaims,
            'pending_claims' => $pendingClaims,
            'rejected_claims' => $rejectedClaims,
            'settlement_ratio' => $totalClaims > 0 ? ($settledClaims / $totalClaims) * 100 : 0,
            'average_claim_amount' => Claim::whereBetween('submitted_at', [$startDate, $endDate])->avg('claim_amount'),
            'total_claim_amount' => Claim::whereBetween('submitted_at', [$startDate, $endDate])->sum('claim_amount'),
            'total_settled_amount' => Claim::settled()->whereBetween('settled_at', [$startDate, $endDate])->sum('approved_amount'),
        ];
    }

    public function getFinancialMetrics(Carbon $startDate, Carbon $endDate): array
    {
        $totalPremium = Policy::whereBetween('effective_date', [$startDate, $endDate])->sum('premium_amount');
        $totalClaims = Claim::settled()->whereBetween('settled_at', [$startDate, $endDate])->sum('approved_amount');
        $totalCommission = Policy::whereBetween('effective_date', [$startDate, $endDate])->sum('commission_amount');
        $totalExpenses = $totalCommission + $totalClaims; // Simplified expense calculation

        return [
            'total_revenue' => $totalPremium,
            'total_expenses' => $totalExpenses,
            'net_profit' => $totalPremium - $totalExpenses,
            'loss_ratio' => $totalPremium > 0 ? ($totalClaims / $totalPremium) * 100 : 0,
            'expense_ratio' => $totalPremium > 0 ? (($totalExpenses - $totalClaims) / $totalPremium) * 100 : 0,
            'combined_ratio' => $totalPremium > 0 ? (($totalClaims + ($totalExpenses - $totalClaims)) / $totalPremium) * 100 : 0,
            'profit_margin' => $totalPremium > 0 ? (($totalPremium - $totalExpenses) / $totalPremium) * 100 : 0,
        ];
    }

    public function getCustomerMetrics(Carbon $startDate, Carbon $endDate): array
    {
        $totalCustomers = Customer::count();
        $newCustomers = Customer::whereBetween('created_at', [$startDate, $endDate])->count();
        $individualCustomers = Customer::individual()->count();
        $corporateCustomers = Customer::corporate()->count();
        $customersWithPolicies = Customer::has('policies')->count();

        return [
            'total_customers' => $totalCustomers,
            'new_customers' => $newCustomers,
            'individual_customers' => $individualCustomers,
            'corporate_customers' => $corporateCustomers,
            'customers_with_policies' => $customersWithPolicies,
            'customers_without_policies' => $totalCustomers - $customersWithPolicies,
            'avg_policies_per_customer' => $totalCustomers > 0 ? Policy::count() / $totalCustomers : 0,
            'customer_retention_rate' => $this->calculateCustomerRetentionRate($startDate, $endDate),
        ];
    }

    public function getProductPerformance(Carbon $startDate, Carbon $endDate): array
    {
        return DB::table('insurance_products')
            ->leftJoin('policies', function ($join) use ($startDate, $endDate) {
                $join->on('insurance_products.id', '=', 'policies.insurance_product_id')
                    ->whereBetween('policies.effective_date', [$startDate, $endDate]);
            })
            ->select(
                'insurance_products.name',
                'insurance_products.type',
                'insurance_products.base_premium',
                DB::raw('COUNT(policies.id) as policy_count'),
                DB::raw('SUM(policies.premium_amount) as total_premium'),
                DB::raw('AVG(policies.premium_amount) as avg_premium'),
                DB::raw('SUM(policies.commission_amount) as total_commission')
            )
            ->groupBy('insurance_products.id', 'insurance_products.name', 'insurance_products.type', 'insurance_products.base_premium')
            ->orderBy('total_premium', 'desc')
            ->get()
            ->toArray();
    }

    public function getTrendsData(Carbon $startDate, Carbon $endDate): array
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

        // Customer acquisition trends
        $acquisitionTrends = Customer::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as count')
        )
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        return [
            'premium_trends' => $premiumTrends,
            'acquisition_trends' => $acquisitionTrends,
        ];
    }

    public function getClaimsByType(Carbon $startDate, Carbon $endDate): array
    {
        return Claim::select('claim_type', DB::raw('COUNT(*) as count'), DB::raw('SUM(claim_amount) as total_amount'))
            ->whereBetween('submitted_at', [$startDate, $endDate])
            ->groupBy('claim_type')
            ->orderBy('count', 'desc')
            ->get()
            ->toArray();
    }

    public function getTopCustomers(int $limit = 10): array
    {
        return Customer::select('customers.*', DB::raw('SUM(policies.premium_amount) as total_premium'))
            ->join('policies', 'customers.id', '=', 'policies.customer_id')
            ->groupBy('customers.id')
            ->orderBy('total_premium', 'desc')
            ->limit($limit)
            ->get()
            ->toArray();
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
}
