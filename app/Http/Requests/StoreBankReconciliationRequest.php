<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBankReconciliationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_bank_account_id' => 'required|exists:client_bank_accounts,id',
            'reconciliation_date' => 'required|date',
            'closing_balance' => 'nullable|numeric',
        ];
    }
}
