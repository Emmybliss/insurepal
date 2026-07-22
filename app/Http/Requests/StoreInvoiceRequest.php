<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'exists:customers,id'],
            'policy_id' => ['nullable', 'exists:policies,id'],
            'due_date' => ['required', 'date'],
            'currency' => ['required', 'string', 'size:3'],
            'notes' => ['nullable', 'string'],
            'billing_address' => ['required', 'array'],
            'shipping_address' => ['nullable', 'array'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0'],
            'items.*.discount_rate' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
