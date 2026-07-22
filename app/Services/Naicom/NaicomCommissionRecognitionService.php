<?php

namespace App\Services\Naicom;

use App\Models\Policy;
use Carbon\Carbon;

/**
 * NaicomCommissionRecognitionService
 *
 * Implements straight-line (pro-rata) commission recognition per NAICOM Form 7.2B requirements
 * and generally-accepted insurance accounting principles (IFRS 17 / NAICOM guidelines).
 *
 * Formula:
 *   Total Commission  = PlacementMarket.reporting_broker_commission (lead)
 *                       OR Policy.commission_amount (fallback when no placement or lead market commission is zero)
 *                       OR first finalised DebitNote commission (future-proof override)
 *
 *   Commission Earned = Total Commission × (Elapsed Days ÷ Total Policy Days)
 *   Commission Deferred = Total Commission − Commission Earned
 *
 * Rules applied:
 *   1. Policy not yet commenced (effective_date > cutoff): Earned = 0, Deferred = Total
 *   2. Policy fully expired (cutoff >= expiry_date): Earned = Total, Deferred = 0
 *   3. Policy active mid-period: Earned = pro-rata, Deferred = remainder
 *   4. Policy cancelled: Use cancellation_date as effective cutoff, defer remainder
 *   5. Zero-day policies (same-day start/end): Earned = Total (instantly recognised)
 *   6. No placement or no lead market → falls back to policy.commission_amount
 *   7. No commission anywhere → returns zeros (no error)
 */
class NaicomCommissionRecognitionService
{
    /**
     * Calculate commission earned and deferred for a policy up to the given cutoff date.
     *
     * The $periodStart parameter constrains the elapsed day window to the reporting half-year
     * boundary, so a policy that started before the H1/H2 period is still measured from the
     * period start rather than from its original inception.
     *
     * @param  Policy  $policy  The policy to evaluate.
     * @param  Carbon  $cutoffDate  End of the recognition window (report date or today).
     * @param  Carbon  $periodStart  Start of the reporting half-year (H1: Jan 1 | H2: Jul 1).
     */
    public function calculateEarnedCommission(
        Policy $policy,
        Carbon $cutoffDate,
        Carbon $periodStart,
    ): array {
        $effectiveDate = $policy->effective_date?->copy()->startOfDay();
        $expiryDate = $policy->expiry_date?->copy()->startOfDay();

        // Guard: cannot compute without policy dates.
        if (! $effectiveDate || ! $expiryDate) {
            return $this->zeroResult();
        }

        $totalCommission = $this->resolveCommission($policy);

        // Zero-day policies are recognised in full immediately.
        $totalDays = (int) $effectiveDate->diffInDays($expiryDate);
        if ($totalDays <= 0) {
            return [
                'earned' => $totalCommission,
                'deferred' => 0.0,
                'total' => $totalCommission,
                'elapsed_days' => 0,
                'total_days' => 0,
            ];
        }

        // Elapsed days are bounded by the reporting period start and the LESSER of:
        //   - policy expiry date (cannot earn past expiry)
        //   - cutoff date (cannot earn past report date)
        $elapsedStart = max($effectiveDate, $periodStart);
        $elapsedEnd = min($expiryDate, $cutoffDate->copy()->startOfDay());
        $elapsedDays = (int) max(0, $elapsedStart->diffInDays($elapsedEnd));

        // Policy has not yet commenced within the recognition window.
        if ($elapsedDays <= 0 && $cutoffDate->copy()->startOfDay()->lessThan($effectiveDate)) {
            return [
                'earned' => 0.0,
                'deferred' => $totalCommission,
                'total' => $totalCommission,
                'elapsed_days' => 0,
                'total_days' => $totalDays,
            ];
        }

        $ratio = min(1.0, $totalDays > 0 ? $elapsedDays / $totalDays : 0);
        $earned = round($totalCommission * $ratio, 2);
        $deferred = round($totalCommission - $earned, 2);

        return [
            'earned' => $earned,
            'deferred' => $deferred,
            'total' => $totalCommission,
            'elapsed_days' => $elapsedDays,
            'total_days' => $totalDays,
        ];
    }

    /**
     * Calculate commission earned for a cancelled policy.
     *
     * Commission is recognised only up to the cancellation date.
     * The unearned portion (from cancellation to original expiry) is deferred and typically
     * returned to the insurer or offset against a credit note.
     *
     * @param  Policy  $policy  The cancelled policy.
     * @param  Carbon  $cancellationDate  The effective date of cancellation.
     */
    public function calculateEarnedCommissionForCancelled(Policy $policy, Carbon $cancellationDate): array
    {
        $effectiveDate = $policy->effective_date?->copy()->startOfDay();
        $expiryDate = $policy->expiry_date?->copy()->startOfDay();

        if (! $effectiveDate || ! $expiryDate) {
            return $this->zeroResult();
        }

        // For cancelled policies the recognition window is: effective_date → cancellation_date.
        return $this->calculateEarnedCommission($policy, $cancellationDate, $effectiveDate);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Resolve total commission for a policy using the priority chain:
     *
     * 1. Lead PlacementMarket.reporting_broker_commission (authoritative underwriting commission).
     *    A placement + lead market MUST exist — without formal underwriting, no commission
     *    can be recognised on the NAICOM Form 7.2B.
     * 2. Lead market exists but reporting_broker_commission is zero → fall back to
     *    Policy.commission_amount. This covers broker-recorded policies where the
     *    commission is stored on the policy rather than the placement market.
     * 3. Finalised DebitNote.premium_breakdown['commission'] (highest-priority override).
     *    When the debit note is issued/paid it represents the agreed contractual figure
     *    and overrides any placement-level commission.
     *
     * Returns 0.0 if no placement or no lead market exists.
     */
    protected function resolveCommission(Policy $policy): float
    {
        $commission = 0.0;

        if ($policy->placement) {
            $leadMarket = $policy->placement->markets?->first(fn ($m) => $m->is_lead);
            if ($leadMarket) {
                $commission = (float) ($leadMarket->reporting_broker_commission ?? 0);

                // Fallback within lead-market block: lead market commission is zero but policy
                // stores the commission amount directly (e.g. broker-recorded policies).
                if ($commission == 0 && (float) ($policy->commission_amount ?? 0) > 0) {
                    $commission = (float) $policy->commission_amount;
                }
            }
        }

        // DebitNote override: a finalised debit note represents the settled commission figure.
        if ($commission > 0 && $policy->relationLoaded('debitNotes')) {
            $finalisedDebitNote = $policy->debitNotes
                ->whereIn('status', ['issued', 'paid'])
                ->first();

            $dnCommission = (float) ($finalisedDebitNote?->premium_breakdown['commission'] ?? 0);
            if ($dnCommission > 0) {
                $commission = $dnCommission;
            }
        }

        return $commission;
    }

    /**
     * @return array{earned: float, deferred: float, total: float, elapsed_days: int, total_days: int}
     */
    protected function zeroResult(): array
    {
        return [
            'earned' => 0.0,
            'deferred' => 0.0,
            'total' => 0.0,
            'elapsed_days' => 0,
            'total_days' => 0,
        ];
    }
}
