<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClientBankAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bank_name' => 'required|string|max:255',
            'account_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:50',
            'account_type' => 'required|in:savings,current',
            'currency' => 'required|string|size:3',
            'is_active' => 'boolean',
            'opening_balance' => 'required|numeric|min:0',
            'opening_balance_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ];
    }
}
