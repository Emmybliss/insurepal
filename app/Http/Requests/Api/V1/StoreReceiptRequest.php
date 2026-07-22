<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->tenant_id;
    }

    public function rules(): array
    {
        $tenantId = Auth::user()->tenant_id;

        return [
            'invoice_id' => ['required', 'integer', Rule::exists('invoices', 'id')->where('tenant_id', $tenantId)],
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')->where('tenant_id', $tenantId)],
            'policy_id' => ['nullable', 'integer', Rule::exists('policies', 'id')->where('tenant_id', $tenantId)],
            'amount_paid' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'string', 'max:255'],
            'payment_date' => ['required', 'date'],
            'currency' => ['nullable', 'string', 'size:3'],
            'transaction_id' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'invoice_id.required' => 'Please select an invoice.',
            'customer_id.required' => 'Please select a customer.',
            'amount_paid.required' => 'The amount paid is required.',
            'amount_paid.min' => 'The amount paid must be at least 0.01.',
            'payment_method.required' => 'The payment method is required.',
            'payment_date.required' => 'The payment date is required.',
        ];
    }
}
