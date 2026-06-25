<?php

namespace App\Services\Naicom;

use App\Enums\ReconciliationStatus;
use App\Models\BankReconciliation;
use App\Models\BankReconciliationLine;
use App\Models\ClientBankAccount;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class BankReconciliationService
{
    public function create(int $tenantId, int $clientBankAccountId, string $reconciliationDate, ?float $closingBalance = null): BankReconciliation
    {
        $calculatedBalance = app(BankAccountService::class)->getCurrentBalance(
            ClientBankAccount::findOrFail($clientBankAccountId),
            $reconciliationDate
        );

        $difference = $closingBalance !== null
            ? round($closingBalance - $calculatedBalance, 2)
            : 0;

        return BankReconciliation::create([
            'tenant_id' => $tenantId,
            'client_bank_account_id' => $clientBankAccountId,
            'reconciliation_date' => $reconciliationDate,
            'closing_balance' => $closingBalance ?? $calculatedBalance,
            'calculated_balance' => $calculatedBalance,
            'difference' => $difference,
            'status' => ReconciliationStatus::Draft,
        ]);
    }

    public function autoMatch(BankReconciliation $reconciliation): Collection
    {
        $account = $reconciliation->clientBankAccount;
        $reconciliationDate = $reconciliation->reconciliation_date;

        $lines = collect();

        $receipts = DB::table('receipts')
            ->where('client_bank_account_id', $account->id)
            ->where('payment_status', 'completed')
            ->where('payment_date', '<=', $reconciliationDate)
            ->get();

        foreach ($receipts as $receipt) {
            $matched = $receipt->cleared_at !== null
                && $receipt->cleared_at <= $reconciliationDate;

            $lines->push(
                BankReconciliationLine::create([
                    'reconciliation_id' => $reconciliation->id,
                    'source_type' => 'receipt',
                    'source_id' => $receipt->id,
                    'type' => 'receipt',
                    'amount' => $receipt->amount_paid,
                    'matched' => $matched,
                ])
            );
        }

        $remittances = DB::table('remittances')
            ->where('client_bank_account_id', $account->id)
            ->where('status', 'completed')
            ->where('remittance_date', '<=', $reconciliationDate)
            ->get();

        foreach ($remittances as $remittance) {
            $lines->push(
                BankReconciliationLine::create([
                    'reconciliation_id' => $reconciliation->id,
                    'source_type' => 'remittance',
                    'source_id' => $remittance->id,
                    'type' => 'remittance',
                    'amount' => -$remittance->total_amount,
                    'matched' => true,
                ])
            );
        }

        return $lines;
    }

    public function reconcile(BankReconciliation $reconciliation, int $reconciledBy, ?float $actualClosingBalance = null): BankReconciliation
    {
        $closingBalance = $actualClosingBalance ?? $reconciliation->closing_balance;
        $calculatedBalance = $reconciliation->calculated_balance;
        $difference = round($closingBalance - $calculatedBalance, 2);

        $status = abs($difference) < 0.01
            ? ReconciliationStatus::Reconciled
            : ReconciliationStatus::DifferenceIdentified;

        $reconciliation->update([
            'closing_balance' => $closingBalance,
            'difference' => $difference,
            'status' => $status,
            'reconciled_at' => now(),
            'reconciled_by' => $reconciledBy,
        ]);

        return $reconciliation->fresh();
    }

    public function getReconciliationForMonth(int $tenantId, int $clientBankAccountId, string $yearMonth): ?BankReconciliation
    {
        $start = "{$yearMonth}-01";
        $end = date('Y-m-t', strtotime($start));

        return BankReconciliation::query()
            ->where('tenant_id', $tenantId)
            ->where('client_bank_account_id', $clientBankAccountId)
            ->whereBetween('reconciliation_date', [$start, $end])
            ->first();
    }

    public function getUnreconciledItems(BankReconciliation $reconciliation): Collection
    {
        return $reconciliation->lines()
            ->where('matched', false)
            ->get();
    }

    public function markLineMatched(BankReconciliationLine $line): BankReconciliationLine
    {
        $line->update(['matched' => true]);

        return $line->fresh();
    }
}
