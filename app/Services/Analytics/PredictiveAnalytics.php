<?php

namespace App\Services\Analytics;

use App\Models\Claim;
use App\Models\Customer;
use App\Models\Policy;
use Carbon\Carbon;

class PredictiveAnalytics
{
    public function predictCustomerChurn(Carbon $startDate, Carbon $endDate): array
    {
        // Get customers with low activity in the last 90 days
        $churnRiskCustomers = Customer::whereHas('policies', function ($query) use ($startDate) {
            $query->where('created_at', '<', $startDate->subDays(90));
        })
            ->whereDoesntHave('policies', function ($query) use ($startDate) {
                $query->where('created_at', '>=', $startDate->subDays(90));
            })
            ->with(['policies' => function ($query) {
                $query->latest();
            }])
            ->limit(10)
            ->get();

        $churnScore = $this->calculateChurnScore($churnRiskCustomers);

        return [
            'churn_risk_customers' => $churnRiskCustomers->count(),
            'churn_score' => $churnScore,
            'high_risk_customers' => $churnRiskCustomers->take(5)->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->display_name,
                    'last_policy_date' => $customer->policies->first()?->created_at?->format('Y-m-d'),
                    'total_premium' => $customer->policies->sum('premium_amount'),
                ];
            }),
        ];
    }

    public function predictPremiumGrowth(Carbon $startDate, Carbon $endDate): array
    {
        // Get historical premium data for trend analysis
        $historicalData = Policy::whereBetween('created_at', [
            $startDate->copy()->subMonths(12),
            $endDate,
        ])
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, SUM(premium_amount) as total_premium')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Calculate growth rate
        $growthRate = $this->calculateGrowthRate($historicalData->pluck('total_premium')->toArray());

        // Predict next 3 months
        $predictions = $this->generatePredictions($historicalData->last()?->total_premium ?? 0, $growthRate);

        return [
            'historical_data' => $historicalData,
            'growth_rate' => $growthRate,
            'predictions' => $predictions,
            'confidence_level' => $this->calculateConfidenceLevel($historicalData->count()),
        ];
    }

    public function predictClaimsVolume(Carbon $startDate, Carbon $endDate): array
    {
        // Get historical claims data
        $historicalClaims = Claim::whereBetween('created_at', [
            $startDate->copy()->subMonths(12),
            $endDate,
        ])
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as claim_count, SUM(amount) as total_amount')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $claimsTrend = $this->calculateClaimsTrend($historicalClaims->pluck('claim_count')->toArray());
        $amountTrend = $this->calculateClaimsTrend($historicalClaims->pluck('total_amount')->toArray());

        return [
            'historical_claims' => $historicalClaims,
            'claims_trend' => $claimsTrend,
            'amount_trend' => $amountTrend,
            'predicted_claims' => $this->predictNextPeriodClaims($historicalClaims->last()?->claim_count ?? 0, $claimsTrend),
            'predicted_amount' => $this->predictNextPeriodClaims($historicalClaims->last()?->total_amount ?? 0, $amountTrend),
        ];
    }

    public function analyzeRiskConcentration(Carbon $startDate, Carbon $endDate): array
    {
        // Analyze risk concentration by product type
        $productRisk = Policy::whereBetween('created_at', [$startDate, $endDate])
            ->join('insurance_products', 'policies.insurance_product_id', '=', 'insurance_products.id')
            ->selectRaw('
                insurance_products.type,
                insurance_products.name,
                COUNT(*) as policy_count,
                SUM(policies.premium_amount) as total_premium,
                AVG(policies.premium_amount) as avg_premium
            ')
            ->groupBy('insurance_products.type', 'insurance_products.name')
            ->orderByDesc('total_premium')
            ->get();

        $totalPremium = $productRisk->sum('total_premium');
        $concentrationRisk = $productRisk->map(function ($product) use ($totalPremium) {
            $percentage = ($product->total_premium / $totalPremium) * 100;

            return [
                'product' => $product->name,
                'type' => $product->type,
                'premium' => $product->total_premium,
                'percentage' => $percentage,
                'risk_level' => $percentage > 30 ? 'high' : ($percentage > 15 ? 'medium' : 'low'),
            ];
        });

        return [
            'concentration_analysis' => $concentrationRisk,
            'high_risk_products' => $concentrationRisk->where('risk_level', 'high'),
            'diversification_score' => $this->calculateDiversificationScore($concentrationRisk),
        ];
    }

    public function forecastRevenue(Carbon $startDate, Carbon $endDate): array
    {
        // Get revenue trends
        $revenueData = Policy::whereBetween('created_at', [
            $startDate->copy()->subMonths(12),
            $endDate,
        ])
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, SUM(premium_amount) as revenue')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $revenueTrend = $this->calculateRevenueTrend($revenueData->pluck('revenue')->toArray());
        $seasonality = $this->analyzeSeasonality($revenueData);

        // Generate 6-month forecast
        $forecast = $this->generateRevenueForecast(
            $revenueData->last()?->revenue ?? 0,
            $revenueTrend,
            $seasonality
        );

        return [
            'historical_revenue' => $revenueData,
            'revenue_trend' => $revenueTrend,
            'seasonality' => $seasonality,
            'forecast' => $forecast,
            'confidence_interval' => $this->calculateConfidenceInterval($revenueData->count()),
        ];
    }

    protected function calculateChurnScore($customers): float
    {
        if ($customers->isEmpty()) {
            return 0;
        }

        $totalCustomers = Customer::count();
        $churnRiskCustomers = $customers->count();

        return ($churnRiskCustomers / $totalCustomers) * 100;
    }

    protected function calculateGrowthRate(array $values): float
    {
        if (count($values) < 2) {
            return 0;
        }

        $first = $values[0];
        $last = end($values);

        return $first > 0 ? (($last - $first) / $first) * 100 : 0;
    }

    protected function generatePredictions(float $lastValue, float $growthRate): array
    {
        $predictions = [];
        $currentValue = $lastValue;

        for ($i = 1; $i <= 3; $i++) {
            $currentValue = $currentValue * (1 + ($growthRate / 100));
            $predictions[] = [
                'month' => now()->addMonths($i)->format('Y-m'),
                'predicted_value' => round($currentValue, 2),
            ];
        }

        return $predictions;
    }

    protected function calculateConfidenceLevel(int $dataPoints): string
    {
        if ($dataPoints >= 12) {
            return 'high';
        }
        if ($dataPoints >= 6) {
            return 'medium';
        }

        return 'low';
    }

    protected function calculateClaimsTrend(array $values): float
    {
        if (count($values) < 2) {
            return 0;
        }

        $first = $values[0];
        $last = end($values);

        return $first > 0 ? (($last - $first) / $first) * 100 : 0;
    }

    protected function predictNextPeriodClaims(float $lastValue, float $trend): float
    {
        return $lastValue * (1 + ($trend / 100));
    }

    protected function calculateDiversificationScore($concentrationData): float
    {
        $maxConcentration = $concentrationData->max('percentage');
        $diversificationScore = 100 - $maxConcentration;

        return max(0, $diversificationScore);
    }

    protected function calculateRevenueTrend(array $values): float
    {
        if (count($values) < 2) {
            return 0;
        }

        $first = $values[0];
        $last = end($values);

        return $first > 0 ? (($last - $first) / $first) * 100 : 0;
    }

    protected function analyzeSeasonality($revenueData): array
    {
        $monthlyAverages = [];

        for ($i = 1; $i <= 12; $i++) {
            $monthData = $revenueData->filter(function ($item) use ($i) {
                return (int) substr($item->month, 5, 2) === $i;
            });

            $monthlyAverages[$i] = $monthData->avg('revenue') ?? 0;
        }

        $overallAverage = collect($monthlyAverages)->avg();

        return collect($monthlyAverages)->map(function ($value, $month) use ($overallAverage) {
            return [
                'month' => $month,
                'average' => $value,
                'seasonality_factor' => $overallAverage > 0 ? $value / $overallAverage : 1,
            ];
        })->values()->toArray();
    }

    protected function generateRevenueForecast(float $lastValue, float $trend, array $seasonality): array
    {
        $forecast = [];
        $baseValue = $lastValue;

        for ($i = 1; $i <= 6; $i++) {
            $month = now()->addMonths($i)->month;
            $seasonalityFactor = collect($seasonality)->firstWhere('month', $month)['seasonality_factor'] ?? 1;

            $predictedValue = $baseValue * (1 + ($trend / 100)) * $seasonalityFactor;

            $forecast[] = [
                'month' => now()->addMonths($i)->format('Y-m'),
                'predicted_revenue' => round($predictedValue, 2),
                'seasonality_factor' => $seasonalityFactor,
            ];
        }

        return $forecast;
    }

    protected function calculateConfidenceInterval(int $dataPoints): array
    {
        $confidence = match (true) {
            $dataPoints >= 12 => 0.95,
            $dataPoints >= 6 => 0.85,
            default => 0.70,
        };

        return [
            'confidence_level' => $confidence,
            'margin_of_error' => (1 - $confidence) * 100,
        ];
    }
}
