<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DebitNoteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'customer_id' => 'required|exists:customers,id',
            'policy_id' => 'nullable|exists:policies,id',
            'policy_number' => 'nullable|string|max:255',
            'description' => 'required|string|max:1000',
            'amount' => 'required|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'tax_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'issue_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'transaction_type' => 'nullable|string|in:new,renewal,endorsement,additional_premium,adjustment,reinstatement,replacement,extension,short_period',
            'policy_type' => 'nullable|string|max:255',
            'class_of_business' => 'nullable|string|max:255',
            'metadata' => 'nullable|array',
            'items' => 'nullable|array',
            'currency_code' => 'required|string|max:3',
            'exchange_rate' => 'required|numeric|min:0',
            'tenant_id' => 'required|exists:tenants,id',
            'settlement_condition' => 'nullable|string',
        ];
    }
}
