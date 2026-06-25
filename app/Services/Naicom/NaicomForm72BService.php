<?php

namespace App\Services\Naicom;

use App\Models\Policy;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

class NaicomForm72BService
{
    public function __construct(
        protected NaicomCommissionRecognitionService $commissionService,
    ) {}

    public function generateData(
        int $tenantId,
        int $reportingYear,
        string $reportingHalf,
        ?string $commissionRecognitionDate = null,
    ): array {
        $periodStart = $reportingHalf === 'H1'
            ? Carbon::create($reportingYear, 1, 1)
            : Carbon::create($reportingYear, 7, 1);

        $periodEnd = $reportingHalf === 'H1'
            ? Carbon::create($reportingYear, 6, 30)
            : Carbon::create($reportingYear, 12, 31);

        $cutoffDate = $commissionRecognitionDate
            ? Carbon::parse($commissionRecognitionDate)->endOfDay()
            : $periodEnd->copy()->endOfDay();

        $policies = $this->loadPolicies($tenantId, $periodStart, $periodEnd);

        $rows = [];
        $serialNumber = 0;

        foreach ($policies as $policy) {
            $policy->loadMissing([
                'customer',
                'placement.markets' => fn ($q) => $q->where('is_lead', true),
                'receiptAllocations.receipt',
            ]);

            $serialNumber++;

            $month = $this->determineMonth($policy, $periodStart, $periodEnd);

            $allocationData = $this->calculateAllocationData($policy);
            $commissionData = $this->calculateCommissionData($policy, $cutoffDate, $periodStart);

            $premiumReceived = $this->calculatePremiumReceivedByBroker($policy);

            $rows[] = [
                'month' => $month,
                'serial_number' => $serialNumber,
                'customer_name' => $policy->customer?->display_name ?? 'N/A',
                'customer_id' => $policy->customer_id,
                'insurer_name' => $policy->insurer_name ?? 'N/A',
                'insurer_id' => $policy->insurer_id,
                'cover_start' => $policy->effective_date?->toDateString(),
                'cover_end' => $policy->expiry_date?->toDateString(),
                'sum_insured' => (float) ($policy->sum_insured ?? 0),
                'premium_direct_to_insurers' => $allocationData['direct_to_insurer'],
                'premium_to_broker_local' => $allocationData['broker_local'],
                'premium_to_broker_foreign' => $allocationData['broker_foreign'],
                'total_gross_premium' => $allocationData['total_gross'],
                'net_premium' => (float) ($policy->net_premium ?? $allocationData['net_premium_calculated']),
                'payment_method' => $allocationData['payment_method'],
                'payment_date' => $allocationData['payment_date'],
                'premium_received_by_broker' => $premiumReceived,
                'total_commission' => $commissionData['total_commission'],
                'co_broker_commission' => $commissionData['co_broker'],
                'reporting_broker_commission' => $commissionData['reporting_broker'],
                'commission_earned' => $commissionData['earned'],
                'commission_deferred' => $commissionData['deferred'],
                'policy_id' => $policy->id,
                'policy_number' => $policy->policy_number,
            ];
        }

        $monthlySummaries = $this->buildMonthlySummaries($rows, $periodStart, $periodEnd);

        return [
            'rows' => $rows,
            'monthly_summaries' => $monthlySummaries,
            'period' => [
                'start' => $periodStart->toDateString(),
                'end' => $periodEnd->toDateString(),
                'half' => $reportingHalf,
                'year' => $reportingYear,
                'cutoff_date' => $cutoffDate->toDateString(),
            ],
        ];
    }

    protected function loadPolicies(int $tenantId, Carbon $periodStart, Carbon $periodEnd): Collection
    {
        return Policy::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['active', 'expired', 'cancelled', 'approved'])
            ->where(function ($q) use ($periodStart, $periodEnd) {
                $q->whereBetween('effective_date', [$periodStart, $periodEnd])
                    ->orWhereBetween('expiry_date', [$periodStart, $periodEnd])
                    ->orWhere(function ($inner) use ($periodStart, $periodEnd) {
                        $inner->where('effective_date', '<=', $periodStart)
                            ->where('expiry_date', '>=', $periodEnd);
                    });
            })
            ->orderBy('effective_date')
            ->get();
    }

    protected function determineMonth(Policy $policy, Carbon $periodStart, Carbon $periodEnd): int
    {
        $date = $policy->effective_date ?? $policy->created_at;

        return max($periodStart->month, min($periodEnd->month, $date->month));
    }

    protected function calculateAllocationData(Policy $policy): array
    {
        $receiptAllocations = $policy->receiptAllocations;

        $directToInsurer = $receiptAllocations
            ->where('is_direct_to_insurer', true)
            ->sum('amount');

        $brokerLocal = $receiptAllocations
            ->where('is_direct_to_insurer', false)
            ->where('currency', 'NGN')
            ->sum('amount');

        $brokerForeign = $receiptAllocations
            ->where('is_direct_to_insurer', false)
            ->where('currency', '!=', 'NGN')
            ->sum('amount');

        $totalGross = $directToInsurer + $brokerLocal + $brokerForeign;

        if ($totalGross === 0.0) {
            $totalGross = (float) ($policy->premium_amount ?? 0);
        }

        $coBroker = 0.0;
        $reportingBroker = 0.0;
        if ($policy->relationLoaded('placement') && $policy->placement) {
            $leadMarket = $policy->placement->markets?->first(fn ($m) => $m->is_lead);
            if ($leadMarket) {
                $coBroker = (float) ($leadMarket->co_broker_commission ?? 0);
                $reportingBroker = (float) ($leadMarket->reporting_broker_commission ?? 0);
            }
        }

        $netPremiumCalculated = $totalGross - $coBroker - $reportingBroker;

        $firstReceipt = $receiptAllocations->first()?->receipt;

        return [
            'direct_to_insurer' => $directToInsurer,
            'broker_local' => $brokerLocal,
            'broker_foreign' => $brokerForeign,
            'total_gross' => $totalGross,
            'net_premium_calculated' => max(0, $netPremiumCalculated),
            'payment_method' => $firstReceipt?->payment_method,
            'payment_date' => $firstReceipt?->payment_date?->toDateString(),
        ];
    }

    protected function calculatePremiumReceivedByBroker(Policy $policy): float
    {
        return $policy->receiptAllocations
            ->where('is_direct_to_insurer', false)
            ->sum('amount');
    }

    protected function calculateCommissionData(Policy $policy, Carbon $cutoffDate, Carbon $periodStart): array
    {
        $coBroker = 0.0;
        $reportingBroker = 0.0;

        if ($policy->relationLoaded('placement') && $policy->placement) {
            $leadMarket = $policy->placement->markets?->first(fn ($m) => $m->is_lead);
            if ($leadMarket) {
                $coBroker = (float) ($leadMarket->co_broker_commission ?? 0);
                $reportingBroker = (float) ($leadMarket->reporting_broker_commission ?? 0);
            }
        }

        $totalCommission = $coBroker + $reportingBroker;

        $earnedDeferred = $this->commissionService->calculateEarnedCommission(
            $policy,
            $cutoffDate,
            $periodStart,
        );

        return [
            'co_broker' => $coBroker,
            'reporting_broker' => $reportingBroker,
            'total_commission' => $totalCommission,
            'earned' => $earnedDeferred['earned'],
            'deferred' => $earnedDeferred['deferred'],
            'elapsed_days' => $earnedDeferred['elapsed_days'],
            'total_days' => $earnedDeferred['total_days'],
        ];
    }

    protected function buildMonthlySummaries(array $rows, Carbon $periodStart, Carbon $periodEnd): array
    {
        $months = [];
        for ($m = $periodStart->month; $m <= $periodEnd->month; $m++) {
            $monthRows = array_filter($rows, fn ($r) => $r['month'] === $m);
            $months[$m] = [
                'month' => $m,
                'month_name' => Carbon::create()->month($m)->format('F'),
                'count' => count($monthRows),
                'total_gross_premium' => round(array_sum(array_column($monthRows, 'total_gross_premium')), 2),
                'total_commission' => round(array_sum(array_column($monthRows, 'total_commission')), 2),
                'total_earned' => round(array_sum(array_column($monthRows, 'commission_earned')), 2),
                'total_deferred' => round(array_sum(array_column($monthRows, 'commission_deferred')), 2),
            ];
        }

        return array_values($months);
    }
}
