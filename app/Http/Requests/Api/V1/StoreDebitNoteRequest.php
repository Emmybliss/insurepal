<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreDebitNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->tenant_id;
    }

    public function rules(): array
    {
        $tenantId = Auth::user()->tenant_id;

        return [
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')->where('tenant_id', $tenantId)],
            'policy_id' => ['nullable', 'integer', Rule::exists('policies', 'id')->where('tenant_id', $tenantId)],
            'description' => ['required', 'string', 'max:5000'],
            'amount' => ['required', 'numeric', 'min:0'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'due_date' => ['nullable', 'date'],
            'currency_code' => ['nullable', 'string', 'size:3'],
            'exchange_rate' => ['nullable', 'numeric', 'min:0'],
            'type' => ['nullable', 'string', 'in:standard,tax'],
            'items' => ['nullable', 'array'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_id.required' => 'Please select a customer.',
            'description.required' => 'The description is required.',
            'amount.required' => 'The amount is required.',
            'total_amount.required' => 'The total amount is required.',
        ];
    }
}
