<?php

namespace App\Services\Naicom;

use App\Models\NaicomReportRun;
use App\Models\Policy;
use Carbon\Carbon;

class NaicomValidationService
{
    public function validate(NaicomReportRun $run): array
    {
        $errors = [];
        $warnings = [];

        $this->validateGeneral($run, $errors, $warnings);
        $this->validateForm72B($run, $errors, $warnings);
        $this->validateForm72C($run, $errors, $warnings);
        $this->validateForm72A($run, $errors, $warnings);

        return [
            'errors' => $errors,
            'warnings' => $warnings,
            'has_errors' => ! empty($errors),
            'has_warnings' => ! empty($warnings),
            'passed' => empty($errors),
        ];
    }

    protected function validateGeneral(NaicomReportRun $run, array &$errors, array &$warnings): void
    {
        $tenant = $run->tenant;

        if (! $tenant?->naicom_reg_number) {
            $errors[] = [
                'code' => 'GEN-001',
                'form' => 'All',
                'severity' => 'error',
                'message' => 'Broker NAICOM registration number is required',
                'blocks' => true,
            ];
        }

        if (! $run->reporting_year || ! $run->reporting_half) {
            $errors[] = [
                'code' => 'GEN-002',
                'form' => 'All',
                'severity' => 'error',
                'message' => 'Reporting period must be selected',
                'blocks' => true,
            ];
        }

        $periodStart = $run->reporting_half->value === 'H1'
            ? Carbon::create($run->reporting_year, 1, 1)
            : Carbon::create($run->reporting_year, 7, 1);

        $periodEnd = $run->reporting_half->value === 'H1'
            ? Carbon::create($run->reporting_year, 6, 30)
            : Carbon::create($run->reporting_year, 12, 31);

        $policyCount = Policy::query()
            ->where('tenant_id', $run->tenant_id)
            ->where(function ($q) use ($periodStart, $periodEnd) {
                $q->whereBetween('effective_date', [$periodStart, $periodEnd])
                    ->orWhereBetween('expiry_date', [$periodStart, $periodEnd])
                    ->orWhere(function ($inner) use ($periodStart, $periodEnd) {
                        $inner->where('effective_date', '<=', $periodStart)
                            ->where('expiry_date', '>=', $periodEnd);
                    });
            })
            ->count();

        if ($policyCount === 0) {
            $errors[] = [
                'code' => 'GEN-003',
                'form' => 'All',
                'severity' => 'error',
                'message' => 'No policies exist in the reporting period',
                'blocks' => true,
            ];
        }
    }

    protected function validateForm72B(NaicomReportRun $run, array &$errors, array &$warnings): void
    {
        $lines = $run->lines()
            ->where('form_type', '7.2B')
            ->get();

        foreach ($lines as $line) {
            $data = $line->data;

            $totalCommission = ($data['co_broker_commission'] ?? 0) + ($data['reporting_broker_commission'] ?? 0);

            if (abs((float) ($totalCommission) - (float) ($data['total_commission'] ?? 0)) > 0.01) {
                $errors[] = [
                    'code' => 'B-001',
                    'form' => '7.2B',
                    'severity' => 'error',
                    'message' => "Policy {$data['policy_number']}: Total commission does not reconcile (co-broker + reporting broker ≠ total)",
                    'blocks' => true,
                    'row' => $line->row_number,
                ];
            }

            $earnedDeferredSum = ($data['commission_earned'] ?? 0) + ($data['commission_deferred'] ?? 0);
            if (abs((float) ($earnedDeferredSum) - (float) ($data['reporting_broker_commission'] ?? 0)) > 0.01) {
                $errors[] = [
                    'code' => 'B-002',
                    'form' => '7.2B',
                    'severity' => 'error',
                    'message' => "Policy {$data['policy_number']}: Earned + deferred commission does not reconcile with reporting broker commission",
                    'blocks' => true,
                    'row' => $line->row_number,
                ];
            }

            if (empty($data['insurer_name']) || $data['insurer_name'] === 'N/A') {
                $warnings[] = [
                    'code' => 'B-003',
                    'form' => '7.2B',
                    'severity' => 'warning',
                    'message' => "Policy {$data['policy_number']}: No insurer assigned",
                    'blocks' => false,
                    'row' => $line->row_number,
                ];
            }

            if (empty($data['customer_name']) || $data['customer_name'] === 'N/A') {
                $errors[] = [
                    'code' => 'B-004',
                    'form' => '7.2B',
                    'severity' => 'error',
                    'message' => "Policy {$data['policy_number']}: No customer assigned",
                    'blocks' => true,
                    'row' => $line->row_number,
                ];
            }

            if (empty($data['cover_start']) || empty($data['cover_end'])) {
                $errors[] = [
                    'code' => 'B-005',
                    'form' => '7.2B',
                    'severity' => 'error',
                    'message' => "Policy {$data['policy_number']}: Missing effective or expiry date",
                    'blocks' => true,
                    'row' => $line->row_number,
                ];
            }

            if (! empty($data['cover_start']) && ! empty($data['cover_end'])) {
                $start = Carbon::parse($data['cover_start']);
                $end = Carbon::parse($data['cover_end']);
                if ($end->lt($start)) {
                    $warnings[] = [
                        'code' => 'B-006',
                        'form' => '7.2B',
                        'severity' => 'warning',
                        'message' => "Policy {$data['policy_number']}: Expiry date is before effective date",
                        'blocks' => true,
                        'row' => $line->row_number,
                    ];
                }
            }

            if (empty($data['sum_insured']) || (float) ($data['sum_insured']) <= 0) {
                $errors[] = [
                    'code' => 'B-007',
                    'form' => '7.2B',
                    'severity' => 'error',
                    'message' => "Policy {$data['policy_number']}: No sum insured value",
                    'blocks' => true,
                    'row' => $line->row_number,
                ];
            }
        }
    }

    protected function validateForm72C(NaicomReportRun $run, array &$errors, array &$warnings): void
    {
        $lines = $run->lines()
            ->where('form_type', '7.2C')
            ->get();

        foreach ($lines as $line) {
            $data = $line->data;

            if ((float) ($data['over_remitted_premium'] ?? 0) > 0.01) {
                $errors[] = [
                    'code' => 'C-001',
                    'form' => '7.2C',
                    'severity' => 'error',
                    'message' => "Policy {$data['policy_number']}: Premium remitted ({$data['premium_remitted']}) exceeds premium due ({$data['premium_due_to_insurers']})",
                    'blocks' => true,
                    'row' => $line->row_number,
                ];
            }

            if ((float) ($data['over_remitted_commission'] ?? 0) > 0.01) {
                $errors[] = [
                    'code' => 'C-002',
                    'form' => '7.2C',
                    'severity' => 'error',
                    'message' => "Policy {$data['policy_number']}: Commission remitted exceeds commission due",
                    'blocks' => true,
                    'row' => $line->row_number,
                ];
            }
        }

        $remittanceCount = $run->lines()
            ->where('form_type', '7.2C')
            ->get()
            ->sum(function ($line) {
                $data = $line->data;

                return ! empty($data['remittance_date']) ? 1 : 0;
            });

        if ($remittanceCount > 0 && $lines->isNotEmpty()) {
            foreach ($lines as $line) {
                $data = $line->data;
                if (! empty($data['remittance_date']) && empty($data['bank_name'])) {
                    $warnings[] = [
                        'code' => 'C-003',
                        'form' => '7.2C',
                        'severity' => 'warning',
                        'message' => "Policy {$data['policy_number']}: Remittance exists but no bank account specified",
                        'blocks' => false,
                        'row' => $line->row_number,
                    ];
                }
            }
        }
    }

    protected function validateForm72A(NaicomReportRun $run, array &$errors, array &$warnings): void
    {
        $lines = $run->lines()
            ->where('form_type', '7.2A')
            ->get();

        foreach ($lines as $line) {
            $data = $line->data;

            $totalAssets = (float) ($data['total_assets'] ?? 0);
            $totalLiabilities = (float) ($data['total_liabilities'] ?? 0);

            if (abs($totalAssets - $totalLiabilities) > 0.01) {
                $errors[] = [
                    'code' => 'A-001',
                    'form' => '7.2A',
                    'severity' => 'error',
                    'message' => "Month {$data['month_name']}: Total assets ({$totalAssets}) do not equal total liabilities ({$totalLiabilities})",
                    'blocks' => true,
                    'row' => $line->row_number,
                ];
            }

            $monthEnd = Carbon::create($run->reporting_year, $data['month'], 1)->endOfMonth();

            $unclearedItems = \App\Models\Receipt::query()
                ->where('tenant_id', $run->tenant_id)
                ->where('payment_date', '<=', $monthEnd)
                ->where('payment_status', \App\Models\Receipt::STATUS_COMPLETED)
                ->where(function ($q) use ($monthEnd) {
                    $q->whereNull('cleared_at')
                        ->orWhere('cleared_at', '>', $monthEnd);
                })
                ->where('payment_date', '<=', $monthEnd->copy()->subDays(30))
                ->sum('amount_paid');

            if ($unclearedItems > 0) {
                $warnings[] = [
                    'code' => 'A-004',
                    'form' => '7.2A',
                    'severity' => 'warning',
                    'message' => "Month {$data['month_name']}: \u{20A6}".number_format($unclearedItems, 2).' uncleared for more than 30 days',
                    'blocks' => false,
                    'row' => $line->row_number,
                ];
            }
        }
    }
}
