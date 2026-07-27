<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdatePolicyRequest extends FormRequest
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
                'sometimes',
                'required',
                'integer',
                Rule::exists('customers', 'id')->where('tenant_id', $tenantId),
            ],
            'policy_product_id' => [
                'sometimes',
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
            'effective_date' => [
                'sometimes',
                'required',
                'date',
            ],
            'expiry_date' => [
                'sometimes',
                'required',
                'date',
                'after:effective_date',
            ],
            'placement_date' => [
                'nullable',
                'date',
            ],
            'coverage_details' => [
                'sometimes',
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
                'nullable',
                'numeric',
                'min:0',
            ],
            'commission_amount' => [
                'nullable',
                'numeric',
                'min:0',
            ],
            'total_amount' => [
                'sometimes',
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
            'customer_id.exists' => 'The selected customer is invalid or does not belong to your organization.',
            'policy_product_id.exists' => 'The selected policy product is invalid.',
            'expiry_date.after' => 'Expiry date must be after the effective date.',
            'coverage_details.min' => 'At least one coverage detail must be provided.',
        ];
    }
}
