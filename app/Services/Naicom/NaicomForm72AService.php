<?php

namespace App\Services\Naicom;

use App\Models\Receipt;
use Carbon\Carbon;

class NaicomForm72AService
{
    public function generateData(
        int $tenantId,
        int $reportingYear,
        string $reportingHalf,
        ?array $form72CRows = null,
    ): array {
        $periodStart = $reportingHalf === 'H1'
            ? Carbon::create($reportingYear, 1, 1)
            : Carbon::create($reportingYear, 7, 1);

        $periodEnd = $reportingHalf === 'H1'
            ? Carbon::create($reportingYear, 6, 30)
            : Carbon::create($reportingYear, 12, 31);

        $rows = [];

        for ($m = $periodStart->month; $m <= $periodEnd->month; $m++) {
            $monthEnd = Carbon::create($reportingYear, $m, 1)->endOfMonth();

            $cashInHand = $this->calculateCashInHand($tenantId, $periodStart, $monthEnd);
            $chequesInHand = $this->calculateChequesInHand($tenantId, $periodStart, $monthEnd);
            $bankBalance = $this->calculateBankBalance($tenantId, $periodStart, $monthEnd);

            $liabilities = $this->calculateLiabilities($form72CRows ?? [], $m);

            $totalAssets = $cashInHand + $chequesInHand + $bankBalance;
            $totalLiabilities = array_sum($liabilities);

            $rows[] = [
                'month' => $m,
                'month_name' => Carbon::create()->month($m)->format('F'),
                'cash_in_hand' => round($cashInHand, 2),
                'cheques_in_hand' => round($chequesInHand, 2),
                'bank_balance' => round($bankBalance, 2),
                'total_assets' => round($totalAssets, 2),
                'premium_awaiting_remittance' => $liabilities['premium'],
                'commission_co_broker_awaiting' => $liabilities['commission_co_broker'],
                'commission_reporting_broker_awaiting' => $liabilities['commission_reporting_broker'],
                'vat_awaiting_remittance' => $liabilities['vat'],
                'others' => $liabilities['others'],
                'total_liabilities' => round($totalLiabilities, 2),
            ];
        }

        return [
            'rows' => $rows,
            'monthly_summaries' => $this->buildMonthlySummaries($rows),
            'period' => [
                'start' => $periodStart->toDateString(),
                'end' => $periodEnd->toDateString(),
                'half' => $reportingHalf,
                'year' => $reportingYear,
            ],
        ];
    }

    protected function calculateCashInHand(int $tenantId, Carbon $periodStart, Carbon $monthEnd): float
    {
        return (float) Receipt::query()
            ->where('tenant_id', $tenantId)
            ->where('payment_method', Receipt::PAYMENT_METHOD_CASH)
            ->where('payment_date', '>=', $periodStart)
            ->where('payment_date', '<=', $monthEnd)
            ->where('payment_status', Receipt::STATUS_COMPLETED)
            ->where(function ($q) use ($monthEnd) {
                $q->whereNull('cleared_at')
                    ->orWhere('cleared_at', '>', $monthEnd);
            })
            ->sum('amount_paid');
    }

    protected function calculateChequesInHand(int $tenantId, Carbon $periodStart, Carbon $monthEnd): float
    {
        return (float) Receipt::query()
            ->where('tenant_id', $tenantId)
            ->where('payment_method', Receipt::PAYMENT_METHOD_CHEQUE)
            ->where('payment_date', '>=', $periodStart)
            ->where('payment_date', '<=', $monthEnd)
            ->where('payment_status', Receipt::STATUS_COMPLETED)
            ->where(function ($q) use ($monthEnd) {
                $q->whereNull('cleared_at')
                    ->orWhere('cleared_at', '>', $monthEnd);
            })
            ->sum('amount_paid');
    }

    protected function calculateBankBalance(int $tenantId, Carbon $periodStart, Carbon $monthEnd): float
    {
        $nonCashChequeMethods = [
            Receipt::PAYMENT_METHOD_BANK_TRANSFER,
            Receipt::PAYMENT_METHOD_CREDIT_CARD,
            Receipt::PAYMENT_METHOD_DEBIT_CARD,
            Receipt::PAYMENT_METHOD_MOBILE_MONEY,
            Receipt::PAYMENT_METHOD_OTHER,
        ];

        return (float) Receipt::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('payment_method', $nonCashChequeMethods)
            ->where('payment_date', '>=', $periodStart)
            ->where('payment_date', '<=', $monthEnd)
            ->where('payment_status', Receipt::STATUS_COMPLETED)
            ->sum('amount_paid');
    }

    protected function calculateLiabilities(array $form72CRows, int $month): array
    {
        $monthRows = array_filter($form72CRows, fn ($r) => ($r['month'] ?? 0) === $month);

        return [
            'premium' => round(array_sum(array_column($monthRows, 'outstanding_premium')), 2),
            'commission_co_broker' => round(array_sum(array_column($monthRows, 'commission_due_co_broker')), 2),
            'commission_reporting_broker' => round(array_sum(array_column($monthRows, 'commission_due_reporting_broker')), 2),
            'vat' => round(array_sum(array_column($monthRows, 'outstanding_vat')), 2),
            'others' => round(array_sum(array_column($monthRows, 'outstanding_claim_return_deposit')), 2),
        ];
    }

    protected function buildMonthlySummaries(array $rows): array
    {
        return array_map(fn ($r) => [
            'month' => $r['month'],
            'month_name' => $r['month_name'],
            'total_assets' => $r['total_assets'],
            'total_liabilities' => $r['total_liabilities'],
            'cash_in_hand' => $r['cash_in_hand'],
            'cheques_in_hand' => $r['cheques_in_hand'],
            'bank_balance' => $r['bank_balance'],
            'premium_awaiting_remittance' => $r['premium_awaiting_remittance'],
            'vat_awaiting_remittance' => $r['vat_awaiting_remittance'],
        ], $rows);
    }
}
