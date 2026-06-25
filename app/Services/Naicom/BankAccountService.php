<?php

namespace App\Services\Naicom;

use App\Models\ClientBankAccount;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class BankAccountService
{
    public function create(array $data): ClientBankAccount
    {
        return ClientBankAccount::create([
            'tenant_id' => $data['tenant_id'],
            'bank_name' => $data['bank_name'],
            'account_name' => $data['account_name'],
            'account_number' => $data['account_number'],
            'account_type' => $data['account_type'] ?? 'current',
            'currency' => $data['currency'] ?? 'NGN',
            'is_active' => $data['is_active'] ?? true,
            'opening_balance' => $data['opening_balance'] ?? 0,
            'opening_balance_date' => $data['opening_balance_date'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);
    }

    public function update(ClientBankAccount $account, array $data): ClientBankAccount
    {
        $account->update($data);

        return $account->fresh();
    }

    public function deactivate(ClientBankAccount $account): ClientBankAccount
    {
        $account->update(['is_active' => false]);

        return $account->fresh();
    }

    public function activate(ClientBankAccount $account): ClientBankAccount
    {
        $account->update(['is_active' => true]);

        return $account->fresh();
    }

    public function getActiveAccounts(int $tenantId): Collection
    {
        return ClientBankAccount::query()
            ->where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('bank_name')
            ->get();
    }

    public function getCurrentBalance(ClientBankAccount $account, ?string $asAtDate = null): float
    {
        $balance = (float) $account->opening_balance;

        $query = DB::table('receipts')
            ->where('client_bank_account_id', $account->id)
            ->where('payment_status', 'completed');

        if ($asAtDate) {
            $query->where('payment_date', '<=', $asAtDate);
        }

        $totalReceipts = (float) $query->sum('amount_paid');

        $remittanceQuery = DB::table('remittances')
            ->where('client_bank_account_id', $account->id)
            ->where('status', 'completed');

        if ($asAtDate) {
            $remittanceQuery->where('remittance_date', '<=', $asAtDate);
        }

        $totalRemittances = (float) $remittanceQuery->sum('total_amount');

        return $balance + $totalReceipts - $totalRemittances;
    }

    public function getAccountSummary(int $tenantId): Collection
    {
        $accounts = $this->getActiveAccounts($tenantId);

        return $accounts->map(function (ClientBankAccount $account) {
            return [
                'account' => $account,
                'current_balance' => $this->getCurrentBalance($account),
                'reconciliation_count' => $account->reconciliations()->count(),
                'last_reconciliation' => $account->reconciliations()
                    ->orderBy('reconciliation_date', 'desc')
                    ->first(),
            ];
        });
    }
}
