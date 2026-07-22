<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StorePlacementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->tenant_id;
    }

    public function rules(): array
    {
        $tenantId = Auth::user()->tenant_id;

        return [
            'quote_id' => ['nullable', 'integer', Rule::exists('quotes', 'id')->where('tenant_id', $tenantId)],
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')->where('tenant_id', $tenantId)],
            'insured_id' => ['nullable', 'integer', Rule::exists('customers', 'id')->where('tenant_id', $tenantId)],
            'policy_product_id' => ['required', 'integer', Rule::exists('policy_products', 'id')->where('tenant_id', $tenantId)],
            'currency' => ['nullable', 'string', 'size:3'],
            'proposed_start_date' => ['required', 'date'],
            'proposed_end_date' => ['required', 'date', 'after:proposed_start_date'],
            'total_sum_insured' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'risk_details' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_id.required' => 'Please select a customer.',
            'customer_id.exists' => 'The selected customer is invalid or does not belong to your organization.',
            'policy_product_id.required' => 'Please select a policy product.',
            'policy_product_id.exists' => 'The selected policy product is invalid or does not belong to your organization.',
            'proposed_start_date.required' => 'Proposed start date is required.',
            'proposed_end_date.required' => 'Proposed end date is required.',
            'proposed_end_date.after' => 'Proposed end date must be after the start date.',
        ];
    }
}
