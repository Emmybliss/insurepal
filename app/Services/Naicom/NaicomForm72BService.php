<?php

namespace App\Services\Naicom;

use App\DTOs\Naicom\Form72BDTO;
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
            $serialNumber++;

            $month = $this->determineMonth($policy, $periodStart, $periodEnd);

            $allocationData = $this->calculateAllocationData($policy);
            $commissionData = $this->calculateCommissionData($policy, $cutoffDate, $periodStart);

            $premiumReceived = $this->calculatePremiumReceivedByBroker($policy, $allocationData);

            $insurerName = $policy->insurer?->name
                ?? $policy->insurer_name
                ?? $policy->placement?->markets?->first(fn ($m) => $m->is_lead)?->insuranceCompany?->name
                ?? 'N/A';

            $sumInsured = (float) ($policy->sum_insured ?? 0);
            if ($sumInsured == 0 && $policy->relationLoaded('risks') && $policy->risks->isNotEmpty()) {
                $sumInsured = (float) $policy->risks->sum('coverage_amount');
            }

            $rows[] = [
                'month' => $month,
                'serial_number' => $serialNumber,
                'customer_name' => $policy->customer?->display_name ?? 'N/A',
                'customer_id' => $policy->customer_id,
                'insurer_name' => $insurerName,
                'insurer_id' => $policy->insurer_id,
                'cover_start' => $policy->effective_date?->toDateString(),
                'cover_end' => $policy->expiry_date?->toDateString(),
                'sum_insured' => $sumInsured,
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

        $dto = new Form72BDTO(
            rows: $rows,
            monthlySummaries: $monthlySummaries,
            period: [
                'start' => $periodStart->toDateString(),
                'end' => $periodEnd->toDateString(),
                'half' => $reportingHalf,
                'year' => $reportingYear,
                'cutoff_date' => $cutoffDate->toDateString(),
            ],
        );

        return $dto->toArray();
    }

    protected function loadPolicies(int $tenantId, Carbon $periodStart, Carbon $periodEnd): Collection
    {
        return Policy::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['active', 'expired', 'cancelled', 'approved', 'recorded', 'issued', 'suspended'])
            ->with([
                'customer',
                'insurer',
                'placement.markets' => fn ($q) => $q->where('is_lead', true)->with('insuranceCompany'),
                'receiptAllocations.receipt',
                'debitNotes',
                'risks',
            ])
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

        $contractualGross = (float) ($policy->debitNotes->first()?->amount ?? $policy->premium_amount ?? 0);

        if ($receiptAllocations->isNotEmpty()) {
            $directToInsurer = (float) $receiptAllocations
                ->where('is_direct_to_insurer', true)
                ->sum('amount');

            $brokerLocal = (float) $receiptAllocations
                ->where('is_direct_to_insurer', false)
                ->where('currency', 'NGN')
                ->sum('amount');

            $brokerForeign = (float) $receiptAllocations
                ->where('is_direct_to_insurer', false)
                ->where('currency', '!=', 'NGN')
                ->sum('amount');

            $allocatedGross = $directToInsurer + $brokerLocal + $brokerForeign;
            $totalGross = $contractualGross > 0 ? $contractualGross : $allocatedGross;
        } else {
            $totalGross = $contractualGross;
            $directToInsurer = 0.0;
            $brokerLocal = 0.0;
            $brokerForeign = 0.0;

            if ($policy->is_direct_to_insurer) {
                $directToInsurer = $totalGross;
            } elseif (($policy->currency ?? 'NGN') === 'NGN') {
                $brokerLocal = $totalGross;
            } else {
                $brokerForeign = $totalGross;
            }
        }

        $coBroker = 0.0;
        $reportingBroker = 0.0;
        if ($policy->placement) {
            $leadMarket = $policy->placement->markets?->first(fn ($m) => $m->is_lead);
            if ($leadMarket) {
                $coBroker = (float) ($leadMarket->co_broker_commission ?? 0);
                $reportingBroker = (float) ($leadMarket->reporting_broker_commission ?? 0);

                if ($reportingBroker == 0 && $coBroker == 0 && (float) ($policy->commission_amount ?? 0) > 0) {
                    $reportingBroker = (float) $policy->commission_amount;
                }
            }
        }

        $netPremiumCalculated = $totalGross - $coBroker - $reportingBroker;

        $firstReceipt = $receiptAllocations->first()?->receipt;
        $paymentMethod = $firstReceipt?->payment_method ?? $policy->payment_method;
        $paymentDate = $firstReceipt?->payment_date?->toDateString() ?? $policy->payment_date?->toDateString();

        return [
            'direct_to_insurer' => $directToInsurer,
            'broker_local' => $brokerLocal,
            'broker_foreign' => $brokerForeign,
            'total_gross' => $totalGross,
            'net_premium_calculated' => max(0, $netPremiumCalculated),
            'payment_method' => $paymentMethod,
            'payment_date' => $paymentDate,
        ];
    }

    protected function calculatePremiumReceivedByBroker(Policy $policy, array $allocationData): float
    {
        if ($policy->receiptAllocations->isNotEmpty()) {
            return (float) $policy->receiptAllocations
                ->where('is_direct_to_insurer', false)
                ->sum('amount');
        }

        return $allocationData['broker_local'] + $allocationData['broker_foreign'];
    }

    protected function calculateCommissionData(Policy $policy, Carbon $cutoffDate, Carbon $periodStart): array
    {
        $coBroker = 0.0;
        $reportingBroker = 0.0;

        if ($policy->placement) {
            $leadMarket = $policy->placement->markets?->first(fn ($m) => $m->is_lead);
            if ($leadMarket) {
                $coBroker = (float) ($leadMarket->co_broker_commission ?? 0);
                $reportingBroker = (float) ($leadMarket->reporting_broker_commission ?? 0);

                if ($reportingBroker == 0 && $coBroker == 0 && (float) ($policy->commission_amount ?? 0) > 0) {
                    $reportingBroker = (float) $policy->commission_amount;
                }
            }
        }

        if ($reportingBroker == 0 && $coBroker == 0 && (float) ($policy->commission_amount ?? 0) > 0) {
            $reportingBroker = (float) $policy->commission_amount;
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
