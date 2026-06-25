<?php

namespace App\Services\Naicom;

use App\Models\Policy;
use Carbon\Carbon;

class NaicomCommissionRecognitionService
{
    protected const SCALE = 4;

    public function calculateEarnedCommission(
        Policy $policy,
        Carbon $cutoffDate,
        Carbon $periodStart,
    ): array {
        $effectiveDate = $policy->effective_date?->startOfDay();
        $expiryDate = $policy->expiry_date?->startOfDay();

        if (! $effectiveDate || ! $expiryDate) {
            return [
                'earned' => 0.0,
                'deferred' => 0.0,
                'total' => 0.0,
                'elapsed_days' => 0,
                'total_days' => 0,
            ];
        }

        $placement = $policy->placement;
        if (! $placement) {
            return [
                'earned' => 0.0,
                'deferred' => 0.0,
                'total' => 0.0,
                'elapsed_days' => 0,
                'total_days' => 0,
            ];
        }

        $leadMarket = $placement->markets()->lead()->first();
        if (! $leadMarket) {
            return [
                'earned' => 0.0,
                'deferred' => 0.0,
                'total' => 0.0,
                'elapsed_days' => 0,
                'total_days' => 0,
            ];
        }

        $reportingBrokerCommission = (float) ($leadMarket->reporting_broker_commission ?? 0);

        $totalDays = (int) $effectiveDate->diffInDays($expiryDate);
        if ($totalDays <= 0) {
            return [
                'earned' => $reportingBrokerCommission,
                'deferred' => 0.0,
                'total' => $reportingBrokerCommission,
                'elapsed_days' => 0,
                'total_days' => 0,
            ];
        }

        $elapsedStart = max($effectiveDate, $periodStart);
        $elapsedEnd = min($expiryDate, $cutoffDate);
        $elapsedDays = (int) max(0, $elapsedStart->diffInDays($elapsedEnd));

        $ratio = $totalDays > 0 ? $elapsedDays / $totalDays : 0;
        $ratio = min($ratio, 1.0);

        $earned = round($reportingBrokerCommission * $ratio, 2);
        $deferred = round($reportingBrokerCommission - $earned, 2);

        return [
            'earned' => $earned,
            'deferred' => $deferred,
            'total' => $reportingBrokerCommission,
            'elapsed_days' => $elapsedDays,
            'total_days' => $totalDays,
        ];
    }

    public function calculateEarnedCommissionForCancelled(Policy $policy, Carbon $cancellationDate): array
    {
        $effectiveDate = $policy->effective_date?->startOfDay();

        $expiryDate = $policy->expiry_date?->startOfDay();

        if (! $effectiveDate || ! $expiryDate) {
            return [
                'earned' => 0.0,
                'deferred' => 0.0,
                'total' => 0.0,
            ];
        }

        return $this->calculateEarnedCommission($policy, $cancellationDate, $effectiveDate);
    }
}
