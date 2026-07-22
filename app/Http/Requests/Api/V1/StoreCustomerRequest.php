<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->user()?->tenant_id
            ?? $this->input('tenant_id')
            ?? $this->route('tenant')?->id;

        $rules = [
            'type' => ['required', 'in:individual,corporate'],
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'email' => [
                'nullable',
                'email',
                'max:255',
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'in:male,female,other'],
            'occupation' => ['nullable', 'string', 'max:255'],
            'annual_income' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
        ];

        if ($this->input('type') === 'corporate') {
            $rules['company_name'] = ['required', 'string', 'max:255'];
        }

        if ($this->input('type') === 'individual') {
            $rules['first_name'] = ['required', 'string', 'max:255'];
            $rules['last_name'] = ['required', 'string', 'max:255'];
        }

        if ($tenantId) {
            $rules['email'][] = Rule::unique('customers', 'email')
                ->where('tenant_id', $tenantId);
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'type.required' => 'Please select customer type.',
            'type.in' => 'Customer type must be individual or corporate.',
            'first_name.required' => 'First name is required for individual customers.',
            'last_name.required' => 'Last name is required for individual customers.',
            'company_name.required' => 'Company name is required for corporate customers.',
            'email.unique' => 'A customer with this email already exists in your account.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'message' => 'The given data was invalid.',
            'errors' => $validator->errors(),
        ], 422));
    }
}
