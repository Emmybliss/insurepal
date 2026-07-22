<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StorePolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->tenant_id;
    }

    public function rules(): array
    {
        $tenantId = Auth::user()->tenant_id;

        return [
            'customer_id' => [
                'required',
                'integer',
                Rule::exists('customers', 'id')->where('tenant_id', $tenantId),
            ],
            'policy_product_id' => [
                'required',
                'integer',
                Rule::exists('policy_products', 'id'),
            ],
            'policy_type_id' => [
                'nullable',
                'integer',
                Rule::exists('policy_types', 'id'),
            ],
            'policy_class_id' => [
                'nullable',
                'integer',
                Rule::exists('policy_classes', 'id'),
            ],
            'quote_id' => [
                'nullable',
                'integer',
                Rule::exists('quotes', 'id')->where('tenant_id', $tenantId),
            ],
            'policy_number' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('policies', 'policy_number')->where('tenant_id', $tenantId),
            ],
            'source_type' => [
                'nullable',
                'string',
                Rule::in(['DIRECT_ISSUANCE', 'BROKER_RECORDED', 'IMPORTED', 'API']),
            ],
            'effective_date' => [
                'required',
                'date',
            ],
            'expiry_date' => [
                'required',
                'date',
                'after:effective_date',
            ],
            'placement_date' => [
                'nullable',
                'date',
            ],
            'coverage_details' => [
                'required',
                'array',
                'min:1',
            ],
            'coverage_details.*.type' => [
                'required',
                'string',
                'max:255',
            ],
            'coverage_details.*.amount' => [
                'required',
                'numeric',
                'min:0',
            ],
            'coverage_details.*.description' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'premium_amount' => [
                'required',
                'numeric',
                'min:0',
            ],
            'commission_amount' => [
                'nullable',
                'numeric',
                'min:0',
            ],
            'total_amount' => [
                'required',
                'numeric',
                'min:0',
            ],
            'payment_frequency' => [
                'nullable',
                'string',
                Rule::in(['monthly', 'quarterly', 'semi_annual', 'annually']),
            ],
            'sum_insured' => [
                'nullable',
                'numeric',
                'min:0',
            ],
            'net_premium' => [
                'nullable',
                'numeric',
                'min:0',
            ],
            'form_data' => [
                'nullable',
                'array',
            ],
            'terms_conditions' => [
                'nullable',
                'string',
                'max:10000',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:2000',
            ],
            'internal_notes' => [
                'nullable',
                'string',
                'max:2000',
            ],
            'insurer_id' => [
                'nullable',
                'integer',
                Rule::exists('tenants', 'id'),
            ],
            'insurer_name' => [
                'nullable',
                'string',
                'max:255',
            ],
            'insurer_email' => [
                'nullable',
                'email',
                'max:255',
            ],
            'insurer_phone' => [
                'nullable',
                'string',
                'max:50',
            ],
            'insurer_address' => [
                'nullable',
                'string',
                'max:500',
            ],
            'insurer_source' => [
                'nullable',
                'string',
                'max:255',
            ],
            'broker_slip_number' => [
                'nullable',
                'string',
                'max:50',
            ],
            'auto_renewal_notification' => [
                'nullable',
                'boolean',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_id.required' => 'Please select a customer.',
            'customer_id.exists' => 'The selected customer is invalid or does not belong to your organization.',
            'policy_product_id.required' => 'Please select a policy product.',
            'policy_product_id.exists' => 'The selected policy product is invalid.',
            'effective_date.required' => 'Effective date is required.',
            'expiry_date.required' => 'Expiry date is required.',
            'expiry_date.after' => 'Expiry date must be after the effective date.',
            'coverage_details.required' => 'Coverage details are required.',
            'coverage_details.min' => 'At least one coverage detail must be provided.',
            'premium_amount.required' => 'Premium amount is required.',
            'total_amount.required' => 'Total amount is required.',
        ];
    }
}
