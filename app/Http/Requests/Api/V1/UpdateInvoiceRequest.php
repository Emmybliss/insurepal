<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->tenant_id;
    }

    public function rules(): array
    {
        $tenantId = Auth::user()->tenant_id;

        return [
            'customer_id' => ['sometimes', 'integer', Rule::exists('customers', 'id')->where('tenant_id', $tenantId)],
            'policy_id' => ['nullable', 'integer', Rule::exists('policies', 'id')->where('tenant_id', $tenantId)],
            'due_date' => ['sometimes', 'date'],
            'currency' => ['nullable', 'string', 'size:3'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'billing_address' => ['nullable', 'array'],
            'shipping_address' => ['nullable', 'array'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.id' => ['nullable', 'integer', Rule::exists('invoice_items', 'id')],
            'items.*.description' => ['required_with:items', 'string', 'max:1000'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.unit_price' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.discount_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
