<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PolicyTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $policyTypeId = $this->route('policy_type')?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:50',
                'regex:/^[A-Z0-9_]+$/',
                Rule::unique('policy_types', 'code')->ignore($policyTypeId),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
            'form_fields' => ['nullable', 'array'],
            'form_fields.*.name' => ['required_with:form_fields', 'string', 'max:255'],
            'form_fields.*.type' => ['required_with:form_fields', 'string', 'in:text,number,select,textarea,checkbox,date,email,phone'],
            'form_fields.*.label' => ['required_with:form_fields', 'string', 'max:255'],
            'form_fields.*.required' => ['boolean'],
            'form_fields.*.options' => ['nullable', 'array'],
            'base_premium' => ['numeric', 'min:0', 'max:999999999999.99'],
            'commission_rate' => ['numeric', 'min:0', 'max:100'],
            'sort_order' => ['integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.regex' => 'The code must contain only uppercase letters, numbers, and underscores.',
            'code.unique' => 'This policy type code is already in use.',
            'form_fields.*.name.required_with' => 'Field name is required when form fields are provided.',
            'form_fields.*.type.in' => 'Invalid field type selected.',
            'commission_rate.max' => 'Commission rate cannot exceed 100%.',
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
