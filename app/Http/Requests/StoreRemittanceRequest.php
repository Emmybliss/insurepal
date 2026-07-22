<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRemittanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_bank_account_id' => ['nullable', 'exists:client_bank_accounts,id'],
            'insurer_id' => ['nullable', 'exists:insurance_companies,id'],
            'remittance_date' => ['required', 'date'],
            'total_amount' => ['required', 'numeric', 'min:0.01'],
            'currency' => ['required', 'string', 'size:3'],
            'payment_method' => ['required', 'string', 'max:50'],
            'reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'allocations' => ['nullable', 'array'],
            'allocations.*.allocatable_type' => ['nullable', 'string'],
            'allocations.*.allocatable_id' => ['nullable', 'integer'],
            'allocations.*.allocation_type' => ['required', 'in:premium,commission,vat,claim,return_premium,deposit'],
            'allocations.*.amount' => ['required', 'numeric', 'min:0.01'],
            'allocations.*.notes' => ['nullable', 'string'],
        ];
    }
}
