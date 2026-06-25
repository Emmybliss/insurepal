<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PolicyProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $policyProductId = $this->route('policy_product')?->id;

        return [
            'tenant_id' => ['nullable', 'exists:tenants,id'],
            'policy_type_id' => ['required', 'exists:policy_types,id'],
            'policy_class_id' => ['required', 'exists:policy_classes,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:100',
                'regex:/^[A-Z0-9_-]+$/',
                Rule::unique('policy_products', 'code')->ignore($policyProductId),
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
            'form_fields' => ['nullable', 'array'],
            'form_fields.*.name' => ['required_with:form_fields', 'string', 'max:100'],
            'form_fields.*.type' => ['required_with:form_fields', 'string', 'in:text,number,select,textarea,checkbox,date,email,phone'],
            'form_fields.*.label' => ['required_with:form_fields', 'string', 'max:255'],
            'form_fields.*.required' => ['required_with:form_fields', 'boolean'],
            'form_fields.*.options' => ['nullable', 'array'],
            'default_values' => ['nullable', 'array'],
            'base_premium' => ['required', 'numeric', 'min:0', 'max:999999999999.99'],
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'premium_factors' => ['nullable', 'array'],
            'premium_factors.*.name' => ['required_with:premium_factors', 'string', 'max:100'],
            'premium_factors.*.rate' => ['required_with:premium_factors', 'numeric', 'min:0'],
            'coverage_details' => ['nullable', 'array'],
            'coverage_details.*.name' => ['required_with:coverage_details', 'string', 'max:255'],
            'coverage_details.*.description' => ['required_with:coverage_details', 'string'],
            'coverage_details.*.limit' => ['nullable', 'numeric', 'min:0'],
            'terms_conditions' => ['nullable', 'array'],
            'exclusions' => ['nullable', 'array'],
            'default_coverage_period' => ['required', 'integer', 'min:1', 'max:3650'],
            'min_sum_assured' => ['required', 'numeric', 'min:0', 'max:999999999999.99'],
            'max_sum_assured' => ['nullable', 'numeric', 'min:0', 'max:999999999999.99', 'gte:min_sum_assured'],
            'requires_underwriting' => ['required', 'boolean'],
            'requires_medical_exam' => ['required', 'boolean'],
            'required_documents' => ['nullable', 'array'],
            'currency' => ['required', 'string', 'in:NGN,USD,EUR,GBP'],
            'sort_order' => ['required', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'policy_type_id.required' => 'Policy type is required.',
            'policy_type_id.exists' => 'Selected policy type is invalid.',
            'policy_class_id.required' => 'Policy class is required.',
            'policy_class_id.exists' => 'Selected policy class is invalid.',
            'name.required' => 'Product name is required.',
            'name.max' => 'Product name must not exceed 255 characters.',
            'code.required' => 'Product code is required.',
            'code.regex' => 'Product code must contain only uppercase letters, numbers, underscores, and hyphens.',
            'code.unique' => 'This product code is already in use.',
            'base_premium.required' => 'Base premium is required.',
            'base_premium.numeric' => 'Base premium must be a valid number.',
            'base_premium.min' => 'Base premium must be at least 0.',
            'commission_rate.required' => 'Commission rate is required.',
            'commission_rate.numeric' => 'Commission rate must be a valid number.',
            'commission_rate.min' => 'Commission rate must be at least 0.',
            'commission_rate.max' => 'Commission rate cannot exceed 100%.',
            'default_coverage_period.required' => 'Default coverage period is required.',
            'default_coverage_period.min' => 'Coverage period must be at least 1 day.',
            'default_coverage_period.max' => 'Coverage period cannot exceed 3650 days (10 years).',
            'min_sum_assured.required' => 'Minimum sum assured is required.',
            'min_sum_assured.numeric' => 'Minimum sum assured must be a valid number.',
            'max_sum_assured.gte' => 'Maximum sum assured must be greater than or equal to minimum sum assured.',
            'currency.required' => 'Currency is required.',
            'currency.in' => 'Invalid currency selected.',
            'sort_order.required' => 'Sort order is required.',
            'sort_order.integer' => 'Sort order must be a valid number.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge([
                'code' => strtoupper($this->code),
            ]);
        }

        // Convert string booleans to actual booleans
        foreach (['is_active', 'requires_underwriting', 'requires_medical_exam'] as $field) {
            if ($this->has($field)) {
                $this->merge([
                    $field => filter_var($this->$field, FILTER_VALIDATE_BOOLEAN),
                ]);
            }
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

            // Validate form fields uniqueness within the same product
            if ($this->form_fields && is_array($this->form_fields)) {
                $fieldNames = collect($this->form_fields)->pluck('name')->filter();
                if ($fieldNames->count() !== $fieldNames->unique()->count()) {
                    $validator->errors()->add('form_fields', 'Form field names must be unique within the product.');
                }
            }
        });
    }
}
