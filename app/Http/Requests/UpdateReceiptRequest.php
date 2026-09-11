<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invoice_id' => ['nullable', 'exists:invoices,id'],
            'customer_id' => ['required', 'exists:customers,id'],
            'policy_id' => ['nullable', 'exists:policies,id'],
            'amount_paid' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'string'],
            'payment_date' => ['required', 'date'],
            'transaction_id' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'currency' => ['required', 'string', 'size:3'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_id.required' => 'Please select a customer.',
            'customer_id.exists' => 'The selected customer is invalid.',
            'amount_paid.required' => 'Please specify the amount paid.',
            'amount_paid.min' => 'The amount paid must be greater than zero.',
            'payment_method.required' => 'Please select a payment method.',
            'payment_date.required' => 'Please select the payment date.',
            'currency.required' => 'Please select a currency.',
        ];
    }

    protected function failedValidation(\Illuminate\Contracts\Validation\Validator $validator): void
    {
        \Illuminate\Support\Facades\Log::warning('Receipt update validation failed', [
            'errors' => $validator->errors()->toArray(),
            'user_id' => \Illuminate\Support\Facades\Auth::id(),
            'tenant_id' => \Illuminate\Support\Facades\Auth::user()?->tenant_id,
            'input' => $this->except(['_token']),
        ]);

        parent::failedValidation($validator);
    }
}
