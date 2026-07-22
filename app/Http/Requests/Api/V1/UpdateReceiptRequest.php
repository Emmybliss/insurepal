<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->tenant_id;
    }

    public function rules(): array
    {
        $tenantId = Auth::user()->tenant_id;

        return [
            'invoice_id' => ['sometimes', 'integer', Rule::exists('invoices', 'id')->where('tenant_id', $tenantId)],
            'customer_id' => ['sometimes', 'integer', Rule::exists('customers', 'id')->where('tenant_id', $tenantId)],
            'policy_id' => ['nullable', 'integer', Rule::exists('policies', 'id')->where('tenant_id', $tenantId)],
            'amount_paid' => ['sometimes', 'numeric', 'min:0.01'],
            'payment_method' => ['sometimes', 'string', 'max:255'],
            'payment_date' => ['sometimes', 'date'],
            'currency' => ['nullable', 'string', 'size:3'],
            'transaction_id' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
