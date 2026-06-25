<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PolicyClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $policyClassId = $this->route('policy_class')?->id;

        return [
            'policy_type_id' => ['required', 'exists:policy_types,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:50',
                'regex:/^[A-Z0-9_]+$/',
                Rule::unique('policy_classes', 'code')->ignore($policyClassId),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
            'form_fields' => ['nullable', 'array'],
            'form_fields.*.name' => ['required_with:form_fields', 'string', 'max:255'],
            'form_fields.*.type' => ['required_with:form_fields', 'string', 'in:text,number,select,textarea,checkbox,date,email,phone'],
            'form_fields.*.label' => ['required_with:form_fields', 'string', 'max:255'],
            'form_fields.*.required' => ['boolean'],
            'form_fields.*.options' => ['nullable', 'array'],
            'premium_multiplier' => ['numeric', 'min:0.0001', 'max:99.9999'],
            'commission_multiplier' => ['numeric', 'min:0.0001', 'max:99.9999'],
            'risk_factors' => ['nullable', 'array'],
            'risk_factors.*.name' => ['required_with:risk_factors', 'string', 'max:255'],
            'risk_factors.*.weight' => ['required_with:risk_factors', 'numeric', 'min:0', 'max:100'],
            'min_coverage_period' => ['integer', 'min:1', 'max:3650'],
            'max_coverage_period' => ['integer', 'min:1', 'max:3650', 'gte:min_coverage_period'],
            'min_sum_assured' => ['numeric', 'min:0', 'max:999999999999.99'],
            'max_sum_assured' => ['nullable', 'numeric', 'min:0', 'max:999999999999.99', 'gte:min_sum_assured'],
            'sort_order' => ['integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'policy_type_id.required' => 'Policy type is required.',
            'policy_type_id.exists' => 'Selected policy type is invalid.',
            'code.regex' => 'The code must contain only uppercase letters, numbers, and underscores.',
            'code.unique' => 'This policy class code is already in use.',
            'form_fields.*.name.required_with' => 'Field name is required when form fields are provided.',
            'form_fields.*.type.in' => 'Invalid field type selected.',
            'premium_multiplier.min' => 'Premium multiplier must be greater than 0.',
            'commission_multiplier.min' => 'Commission multiplier must be greater than 0.',
            'max_coverage_period.gte' => 'Maximum coverage period must be greater than or equal to minimum coverage period.',
            'max_sum_assured.gte' => 'Maximum sum assured must be greater than or equal to minimum sum assured.',
            'risk_factors.*.name.required_with' => 'Risk factor name is required.',
            'risk_factors.*.weight.required_with' => 'Risk factor weight is required.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge([
                'code' => strtoupper($this->code),
            ]);
        }
    }
}
