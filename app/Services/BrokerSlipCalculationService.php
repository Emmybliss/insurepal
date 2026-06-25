<?php

namespace App\Services;

use App\Enums\RateBasis;

class BrokerSlipCalculationService
{
    public function calculateGrossPremium(
        float $sumInsured,
        ?float $rate,
        ?string $rateBasis,
        ?float $fixedAmount = null,
    ): float {
        if ($rateBasis === RateBasis::Fixed->value && $fixedAmount !== null) {
            return round($fixedAmount, 2);
        }

        if ($rate === null || $rate == 0) {
            return 0;
        }

        return match ($rateBasis) {
            RateBasis::Percentage->value => round($sumInsured * $rate / 100, 2),
            RateBasis::PerMille->value => round($sumInsured * $rate / 1000, 2),
            default => 0,
        };
    }

    public function calculateCommission(float $grossPremium, ?float $commissionRate, ?float $overrideAmount = null): float
    {
        if ($overrideAmount !== null) {
            return round($overrideAmount, 2);
        }

        if ($commissionRate === null || $commissionRate == 0) {
            return 0;
        }

        return round($grossPremium * $commissionRate / 100, 2);
    }

    public function calculateNetPremium(
        float $grossPremium,
        float $commissionAmount,
        ?float $coBrokerCommission = null,
        ?float $reportingBrokerCommission = null,
        ?float $fees = null,
        ?float $taxes = null,
        ?float $discount = null,
    ): float {
        $net = $grossPremium;
        $net -= $commissionAmount;
        $net -= $coBrokerCommission ?? 0;
        $net -= $reportingBrokerCommission ?? 0;
        $net += $fees ?? 0;
        $net += $taxes ?? 0;
        $net -= $discount ?? 0;

        return round(max($net, 0), 2);
    }

    public function calculateParticipationPremium(float $grossPremium, float $participationPercentage): float
    {
        return round($grossPremium * $participationPercentage / 100, 2);
    }

    public function calculateItemPremium(
        float $sumInsured,
        ?float $rate,
        string $rateBasis = 'percentage',
        ?int $quantity = null,
    ): float {
        $premium = match ($rateBasis) {
            RateBasis::Percentage->value => $sumInsured * ($rate ?? 0) / 100,
            RateBasis::PerMille->value => $sumInsured * ($rate ?? 0) / 1000,
            default => $rate ?? 0,
        };

        if ($quantity !== null && $quantity > 1) {
            $premium *= $quantity;
        }

        return round($premium, 2);
    }
}
