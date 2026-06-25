<?php

namespace App\Services\Naicom;

use App\Enums\AllocationType;
use App\Models\Claim;
use App\Models\CreditNote;
use App\Models\Policy;
use App\Models\RemittanceAllocation;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

class NaicomForm72CService
{
    public function generateData(
        int $tenantId,
        int $reportingYear,
        string $reportingHalf,
    ): array {
        $periodStart = $reportingHalf === 'H1'
            ? Carbon::create($reportingYear, 1, 1)
            : Carbon::create($reportingYear, 7, 1);

        $periodEnd = $reportingHalf === 'H1'
            ? Carbon::create($reportingYear, 6, 30)
            : Carbon::create($reportingYear, 12, 31);

        $policies = $this->loadPolicies($tenantId, $periodStart, $periodEnd);

        $policyIds = $policies->pluck('id')->toArray();

        $remittanceByPolicy = $this->loadRemittancesByPolicy($tenantId, $policyIds, $periodStart, $periodEnd);

        $rows = [];
        $serialNumber = 0;

        foreach ($policies as $policy) {
            $policy->loadMissing([
                'customer',
                'placement.markets' => fn ($q) => $q->where('is_lead', true),
                'receiptAllocations.receipt',
                'creditNotes' => fn ($q) => $q->whereIn('status', ['issued', 'paid']),
            ]);

            $serialNumber++;

            $month = $this->determineMonth($policy, $periodStart, $periodEnd);

            $totalReceived = $this->calculateTotalReceived($policy, $tenantId);
            $premiumDueToInsurers = $this->calculatePremiumDueToInsurers($policy);
            $depositMade = $this->calculateDepositMade($policy);
            $returnedPremium = $this->calculateReturnedPremium($policy);
            $claimsDue = $this->calculateClaimsDue($policy, $tenantId);
            $vatDue = $this->calculateVatDue($policy);
            $commissionDue = $this->calculateCommissionDue($policy);

            $policyRemittanceData = $remittanceByPolicy[$policy->id] ?? [
                'remittance_date' => null,
                'bank_name' => null,
                'premium_remitted' => 0.0,
                'claim_return_deposit_remitted' => 0.0,
                'vat_remitted' => 0.0,
                'commission_remitted' => 0.0,
            ];

            $totalCommissionDue = $commissionDue['co_broker'] + $commissionDue['reporting_broker'];

            $outstandingPremium = (float) max(0, $premiumDueToInsurers - $policyRemittanceData['premium_remitted']);
            $outstandingClaimReturnDeposit = (float) max(0, ($claimsDue + $returnedPremium + $depositMade) - $policyRemittanceData['claim_return_deposit_remitted']);
            $outstandingVat = (float) max(0, $vatDue - $policyRemittanceData['vat_remitted']);
            $outstandingCommission = (float) max(0, $totalCommissionDue - $policyRemittanceData['commission_remitted']);

            $rows[] = [
                'month' => $month,
                'serial_number' => $serialNumber,
                'customer_name' => $policy->customer?->display_name ?? 'N/A',
                'customer_id' => $policy->customer_id,
                'policy_number' => $policy->policy_number,
                'insurer_name' => $policy->insurer_name ?? 'N/A',
                'insurer_id' => $policy->insurer_id,
                'cover_start' => $policy->effective_date?->toDateString(),
                'cover_end' => $policy->expiry_date?->toDateString(),
                'total_received' => $totalReceived,
                'premium_due_to_insurers' => $premiumDueToInsurers,
                'deposit_made' => $depositMade,
                'returned_premium_due' => $returnedPremium,
                'claims_due_to_insured' => $claimsDue,
                'vat_due' => $vatDue,
                'commission_due_co_broker' => $commissionDue['co_broker'],
                'commission_due_reporting_broker' => $commissionDue['reporting_broker'],
                'remittance_date' => $policyRemittanceData['remittance_date'],
                'bank_name' => $policyRemittanceData['bank_name'],
                'premium_remitted' => $policyRemittanceData['premium_remitted'],
                'claim_return_deposit_remitted' => $policyRemittanceData['claim_return_deposit_remitted'],
                'vat_remitted' => $policyRemittanceData['vat_remitted'],
                'commission_remitted' => $policyRemittanceData['commission_remitted'],
                'outstanding_premium' => $outstandingPremium,
                'outstanding_claim_return_deposit' => $outstandingClaimReturnDeposit,
                'outstanding_vat' => $outstandingVat,
                'outstanding_commission' => $outstandingCommission,
                'over_remitted_premium' => (float) max(0, $policyRemittanceData['premium_remitted'] - $premiumDueToInsurers),
                'over_remitted_commission' => (float) max(0, $policyRemittanceData['commission_remitted'] - $totalCommissionDue),
                'policy_id' => $policy->id,
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

    protected function loadRemittancesByPolicy(int $tenantId, array $policyIds, Carbon $periodStart, Carbon $periodEnd): array
    {
        if (empty($policyIds)) {
            return [];
        }

        $allocations = RemittanceAllocation::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('allocatable_type', [Policy::class])
            ->whereIn('allocatable_id', $policyIds)
            ->whereHas('remittance', function ($q) use ($periodStart, $periodEnd) {
                $q->where('status', 'completed')
                    ->whereBetween('remittance_date', [$periodStart, $periodEnd]);
            })
            ->with('remittance.clientBankAccount')
            ->get();

        $claimAllocations = RemittanceAllocation::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('allocatable_type', [Claim::class])
            ->whereHasMorph('allocatable', [Claim::class], function ($q) use ($policyIds) {
                $q->whereIn('policy_id', $policyIds);
            })
            ->whereHas('remittance', function ($q) use ($periodStart, $periodEnd) {
                $q->where('status', 'completed')
                    ->whereBetween('remittance_date', [$periodStart, $periodEnd]);
            })
            ->with('remittance.clientBankAccount', 'allocatable')
            ->get();

        $creditNoteAllocations = RemittanceAllocation::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('allocatable_type', [CreditNote::class])
            ->whereHasMorph('allocatable', [CreditNote::class], function ($q) use ($policyIds) {
                $q->whereIn('policy_id', $policyIds);
            })
            ->whereHas('remittance', function ($q) use ($periodStart, $periodEnd) {
                $q->where('status', 'completed')
                    ->whereBetween('remittance_date', [$periodStart, $periodEnd]);
            })
            ->with('remittance.clientBankAccount', 'allocatable')
            ->get();

        return $this->aggregateRemittancesByPolicy(
            $allocations,
            $claimAllocations,
            $creditNoteAllocations,
        );
    }

    protected function aggregateRemittancesByPolicy(
        Collection $policyAllocations,
        Collection $claimAllocations,
        Collection $creditNoteAllocations,
    ): array {
        $result = [];

        foreach ($policyAllocations as $alloc) {
            $policyId = $alloc->allocatable_id;

            if (! isset($result[$policyId])) {
                $result[$policyId] = $this->emptyRemittanceRow($alloc);
            }

            $rem = $alloc->remittance;
            $result[$policyId]['remittance_date'] ??= $rem?->remittance_date?->toDateString();
            $result[$policyId]['bank_name'] ??= $rem?->clientBankAccount?->bank_name;

            match ($alloc->allocation_type->value) {
                'premium' => $result[$policyId]['premium_remitted'] += (float) $alloc->amount,
                'vat' => $result[$policyId]['vat_remitted'] += (float) $alloc->amount,
                'commission' => $result[$policyId]['commission_remitted'] += (float) $alloc->amount,
                default => null,
            };
        }

        foreach ($claimAllocations as $alloc) {
            $claim = $alloc->allocatable;
            $policyId = $claim?->policy_id;

            if (! $policyId) {
                continue;
            }

            if (! isset($result[$policyId])) {
                $result[$policyId] = $this->emptyRemittanceRow($alloc);
            }

            $rem = $alloc->remittance;
            $result[$policyId]['remittance_date'] ??= $rem?->remittance_date?->toDateString();
            $result[$policyId]['bank_name'] ??= $rem?->clientBankAccount?->bank_name;

            $result[$policyId]['claim_return_deposit_remitted'] += (float) $alloc->amount;
        }

        foreach ($creditNoteAllocations as $alloc) {
            $creditNote = $alloc->allocatable;
            $policyId = $creditNote?->policy_id;

            if (! $policyId) {
                continue;
            }

            if (! isset($result[$policyId])) {
                $result[$policyId] = $this->emptyRemittanceRow($alloc);
            }

            $rem = $alloc->remittance;
            $result[$policyId]['remittance_date'] ??= $rem?->remittance_date?->toDateString();
            $result[$policyId]['bank_name'] ??= $rem?->clientBankAccount?->bank_name;

            $result[$policyId]['claim_return_deposit_remitted'] += (float) $alloc->amount;
        }

        return $result;
    }

    protected function emptyRemittanceRow($alloc): array
    {
        $rem = $alloc->remittance;

        return [
            'remittance_date' => $rem?->remittance_date?->toDateString(),
            'bank_name' => $rem?->clientBankAccount?->bank_name,
            'premium_remitted' => 0.0,
            'claim_return_deposit_remitted' => 0.0,
            'vat_remitted' => 0.0,
            'commission_remitted' => 0.0,
        ];
    }

    protected function determineMonth(Policy $policy, Carbon $periodStart, Carbon $periodEnd): int
    {
        $date = $policy->effective_date ?? $policy->created_at;

        return max($periodStart->month, min($periodEnd->month, $date->month));
    }

    protected function calculateTotalReceived(Policy $policy, int $tenantId): float
    {
        $receiptTotal = $policy->receiptAllocations->sum('amount');

        $claimTotal = Claim::query()
            ->where('tenant_id', $tenantId)
            ->where('policy_id', $policy->id)
            ->whereIn('status', ['approved', 'settled', 'closed'])
            ->sum('approved_amount');

        return (float) $receiptTotal + (float) $claimTotal;
    }

    protected function calculatePremiumDueToInsurers(Policy $policy): float
    {
        $grossPremium = (float) ($policy->premium_amount ?? 0);

        if ($grossPremium === 0.0) {
            $grossPremium = $policy->receiptAllocations->sum('amount');
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

        return max(0, $grossPremium - $coBroker - $reportingBroker);
    }

    protected function calculateDepositMade(Policy $policy): float
    {
        return (float) $policy->receiptAllocations
            ->filter(fn ($a) => $a->allocation_type === AllocationType::Deposit)
            ->sum('amount');
    }

    protected function calculateReturnedPremium(Policy $policy): float
    {
        return (float) $policy->creditNotes->sum('amount');
    }

    protected function calculateClaimsDue(Policy $policy, int $tenantId): float
    {
        return (float) Claim::query()
            ->where('tenant_id', $tenantId)
            ->where('policy_id', $policy->id)
            ->whereIn('status', ['approved', 'settled', 'closed'])
            ->sum('approved_amount');
    }

    protected function calculateVatDue(Policy $policy): float
    {
        return (float) $policy->receiptAllocations
            ->filter(fn ($a) => $a->allocation_type === AllocationType::Vat)
            ->sum('amount');
    }

    protected function calculateCommissionDue(Policy $policy): array
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

        return [
            'co_broker' => $coBroker,
            'reporting_broker' => $reportingBroker,
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
                'total_received' => round(array_sum(array_column($monthRows, 'total_received')), 2),
                'premium_due' => round(array_sum(array_column($monthRows, 'premium_due_to_insurers')), 2),
                'premium_remitted' => round(array_sum(array_column($monthRows, 'premium_remitted')), 2),
                'total_outstanding_premium' => round(array_sum(array_column($monthRows, 'outstanding_premium')), 2),
                'total_outstanding_commission' => round(array_sum(array_column($monthRows, 'outstanding_commission')), 2),
            ];
        }

        return array_values($months);
    }
}
