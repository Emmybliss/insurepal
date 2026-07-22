<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreInvoiceRequest extends FormRequest
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
            'due_date' => ['required', 'date'],
            'currency' => ['nullable', 'string', 'size:3'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'billing_address' => ['nullable', 'array'],
            'shipping_address' => ['nullable', 'array'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:1000'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.discount_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_id.required' => 'Please select a customer.',
            'customer_id.exists' => 'The selected customer is invalid or does not belong to your organization.',
            'due_date.required' => 'The due date is required.',
            'items.required' => 'At least one invoice item is required.',
            'items.min' => 'At least one invoice item is required.',
            'items.*.description.required' => 'Each item must have a description.',
            'items.*.quantity.required' => 'Each item must have a quantity.',
            'items.*.unit_price.required' => 'Each item must have a unit price.',
        ];
    }
}
