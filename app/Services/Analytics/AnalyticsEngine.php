<?php

namespace App\Services\Analytics;

use App\Models\Claim;
use App\Models\Customer;
use App\Models\Policy;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsEngine
{
    public function predictCustomerChurn(Carbon $startDate, Carbon $endDate): array
    {
        // Simple churn prediction based on policy activity
        $customersAtRisk = Customer::whereDoesntHave('policies', function ($query) use ($startDate) {
            $query->where('effective_date', '>=', $startDate->subMonths(6));
        })->count();

        $totalCustomers = Customer::count();
        $churnRiskPercentage = $totalCustomers > 0 ? ($customersAtRisk / $totalCustomers) * 100 : 0;

        return [
            'customers_at_risk' => $customersAtRisk,
            'churn_risk_percentage' => $churnRiskPercentage,
            'predicted_churn_next_month' => $this->calculatePredictedChurn($startDate, $endDate),
        ];
    }

    public function forecastPremiumGrowth(Carbon $startDate, Carbon $endDate): array
    {
        // Get historical premium data for trend analysis
        $historicalData = Policy::select(
            DB::raw('YEAR(effective_date) as year'),
            DB::raw('MONTH(effective_date) as month'),
            DB::raw('SUM(premium_amount) as total_premium')
        )
            ->where('effective_date', '>=', $startDate->subYear())
            ->where('effective_date', '<=', $endDate)
            ->groupBy(DB::raw('YEAR(effective_date)'), DB::raw('MONTH(effective_date)'))
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        // Calculate growth rate
        $growthRate = $this->calculateGrowthRate($historicalData);

        return [
            'historical_data' => $historicalData,
            'growth_rate' => $growthRate,
            'forecasted_premium' => $this->calculateForecastedPremium($historicalData, $growthRate),
        ];
    }

    public function analyzeRiskExposure(Carbon $startDate, Carbon $endDate): array
    {
        // Risk concentration analysis
        $riskByProduct = Policy::select(
            'insurance_products.name',
            'insurance_products.type',
            DB::raw('COUNT(*) as policy_count'),
            DB::raw('SUM(policies.premium_amount) as total_premium'),
            DB::raw('AVG(policies.premium_amount) as avg_premium')
        )
            ->join('insurance_products', 'policies.insurance_product_id', '=', 'insurance_products.id')
            ->whereBetween('policies.effective_date', [$startDate, $endDate])
            ->groupBy('insurance_products.id', 'insurance_products.name', 'insurance_products.type')
            ->orderBy('total_premium', 'desc')
            ->get();

        $totalPremium = $riskByProduct->sum('total_premium');
        $concentrationRisk = $this->calculateConcentrationRisk($riskByProduct, $totalPremium);

        return [
            'risk_by_product' => $riskByProduct,
            'concentration_risk' => $concentrationRisk,
            'diversification_score' => $this->calculateDiversificationScore($riskByProduct),
        ];
    }

    public function predictClaimsVolume(Carbon $startDate, Carbon $endDate): array
    {
        // Historical claims data for prediction
        $historicalClaims = Claim::select(
            DB::raw('YEAR(submitted_at) as year'),
            DB::raw('MONTH(submitted_at) as month'),
            DB::raw('COUNT(*) as claim_count'),
            DB::raw('SUM(claim_amount) as total_amount')
        )
            ->where('submitted_at', '>=', $startDate->subYear())
            ->where('submitted_at', '<=', $endDate)
            ->groupBy(DB::raw('YEAR(submitted_at)'), DB::raw('MONTH(submitted_at)'))
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        $seasonalPattern = $this->identifySeasonalPattern($historicalClaims);
        $trend = $this->calculateTrend($historicalClaims);

        return [
            'historical_claims' => $historicalClaims,
            'seasonal_pattern' => $seasonalPattern,
            'trend' => $trend,
            'predicted_claims' => $this->predictNextPeriodClaims($historicalClaims, $trend),
        ];
    }

    protected function calculatePredictedChurn(Carbon $startDate, Carbon $endDate): int
    {
        // Simple prediction based on recent activity
        $inactiveCustomers = Customer::whereDoesntHave('policies', function ($query) use ($startDate) {
            $query->where('effective_date', '>=', $startDate->subMonths(3));
        })->count();

        return (int) ($inactiveCustomers * 0.3); // 30% of inactive customers likely to churn
    }

    protected function calculateGrowthRate($historicalData): float
    {
        if ($historicalData->count() < 2) {
            return 0;
        }

        $firstPeriod = $historicalData->first();
        $lastPeriod = $historicalData->last();

        if ($firstPeriod->total_premium == 0) {
            return 0;
        }

        return (($lastPeriod->total_premium - $firstPeriod->total_premium) / $firstPeriod->total_premium) * 100;
    }

    protected function calculateForecastedPremium($historicalData, float $growthRate): float
    {
        if ($historicalData->isEmpty()) {
            return 0;
        }

        $lastPeriod = $historicalData->last();

        return $lastPeriod->total_premium * (1 + ($growthRate / 100));
    }

    protected function calculateConcentrationRisk($riskByProduct, float $totalPremium): array
    {
        $concentrationRisk = [];
        foreach ($riskByProduct as $product) {
            $percentage = $totalPremium > 0 ? ($product->total_premium / $totalPremium) * 100 : 0;
            $concentrationRisk[] = [
                'product' => $product->name,
                'percentage' => $percentage,
                'risk_level' => $percentage > 30 ? 'high' : ($percentage > 15 ? 'medium' : 'low'),
            ];
        }

        return $concentrationRisk;
    }

    protected function calculateDiversificationScore($riskByProduct): float
    {
        $totalPremium = $riskByProduct->sum('total_premium');
        $score = 0;

        foreach ($riskByProduct as $product) {
            $percentage = $totalPremium > 0 ? ($product->total_premium / $totalPremium) : 0;
            $score += $percentage * $percentage; // Herfindahl index
        }

        return 1 - $score; // Higher score = better diversification
    }

    protected function identifySeasonalPattern($historicalClaims): array
    {
        // Simple seasonal analysis
        $monthlyAverages = [];
        for ($i = 1; $i <= 12; $i++) {
            $monthlyData = $historicalClaims->where('month', $i);
            $monthlyAverages[$i] = $monthlyData->avg('claim_count') ?? 0;
        }

        return $monthlyAverages;
    }

    protected function calculateTrend($historicalClaims): string
    {
        if ($historicalClaims->count() < 2) {
            return 'insufficient_data';
        }

        $firstHalf = $historicalClaims->take($historicalClaims->count() / 2)->avg('claim_count');
        $secondHalf = $historicalClaims->skip($historicalClaims->count() / 2)->avg('claim_count');

        if ($secondHalf > $firstHalf * 1.1) {
            return 'increasing';
        } elseif ($secondHalf < $firstHalf * 0.9) {
            return 'decreasing';
        }

        return 'stable';
    }

    protected function predictNextPeriodClaims($historicalClaims, string $trend): int
    {
        $averageClaims = $historicalClaims->avg('claim_count');

        switch ($trend) {
            case 'increasing':
                return (int) ($averageClaims * 1.1);
            case 'decreasing':
                return (int) ($averageClaims * 0.9);
            default:
                return (int) $averageClaims;
        }
    }
}
