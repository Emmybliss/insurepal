<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $policyId = $this->route('policy')?->id;

        return [
            'tenant_id' => ['nullable', 'exists:tenants,id'],
            'customer_id' => ['required', 'exists:customers,id'],
            'quote_id' => ['nullable', 'exists:quotes,id'],
            'insurance_product_id' => ['required', 'exists:insurance_products,id'],
            'policy_type_id' => ['required', 'exists:policy_types,id'],
            'policy_class_id' => ['required', 'exists:policy_classes,id'],
            'policy_number' => [
                'required',
                'string',
                'max:50',
                'regex:/^[A-Z0-9_-]+$/',
                Rule::unique('policies', 'policy_number')->ignore($policyId),
            ],
            'status' => ['required', 'string', 'in:draft,active,expired,cancelled,suspended'],
            'effective_date' => ['required', 'date', 'after_or_equal:today'],
            'expiry_date' => ['required', 'date', 'after:effective_date'],
            'coverage_details' => ['nullable', 'array'],
            'premium_amount' => ['required', 'numeric', 'min:0', 'max:999999999999.99'],
            'commission_amount' => ['nullable', 'numeric', 'min:0', 'max:999999999999.99'],
            'total_amount' => ['required', 'numeric', 'min:0', 'max:999999999999.99'],
            'payment_frequency' => ['required', 'string', 'in:annual,semi_annual,quarterly,monthly'],
            'form_data' => ['nullable', 'array'],
            'terms_conditions' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'created_by' => ['nullable', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_id.required' => 'Customer is required.',
            'customer_id.exists' => 'Selected customer is invalid.',
            'insurance_product_id.required' => 'Insurance product is required.',
            'insurance_product_id.exists' => 'Selected insurance product is invalid.',
            'policy_type_id.required' => 'Policy type is required.',
            'policy_type_id.exists' => 'Selected policy type is invalid.',
            'policy_class_id.required' => 'Policy class is required.',
            'policy_class_id.exists' => 'Selected policy class is invalid.',
            'policy_number.required' => 'Policy number is required.',
            'policy_number.regex' => 'The policy number must contain only uppercase letters, numbers, underscores, and hyphens.',
            'policy_number.unique' => 'This policy number is already in use.',
            'status.required' => 'Policy status is required.',
            'status.in' => 'Invalid policy status selected.',
            'effective_date.required' => 'Effective date is required.',
            'effective_date.after_or_equal' => 'Effective date must be today or later.',
            'expiry_date.required' => 'Expiry date is required.',
            'expiry_date.after' => 'Expiry date must be after the effective date.',
            'premium_amount.required' => 'Premium amount is required.',
            'premium_amount.numeric' => 'Premium amount must be a valid number.',
            'payment_frequency.required' => 'Payment frequency is required.',
            'payment_frequency.in' => 'Invalid payment frequency selected.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('policy_number')) {
            $this->merge([
                'policy_number' => strtoupper($this->policy_number),
            ]);
        }

        // Auto-set created_by to current user if not provided
        if (! $this->has('created_by') && auth()->id()) {
            $this->merge([
                'created_by' => auth()->id(),
            ]);
        }
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->policy_class_id && $this->policy_type_id) {
                $class = \App\Models\PolicyClass::find($this->policy_class_id);
                if ($class && $class->policy_type_id != $this->policy_type_id) {
                    $validator->errors()->add('policy_class_id', 'Selected class does not belong to the selected policy type.');
                }
            }
        });
    }
}
