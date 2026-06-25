<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Auth;

class CustomerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $nullableFields = ['email', 'phone', 'date_of_birth', 'gender', 'occupation', 'annual_income', 'address', 'city', 'state', 'country', 'known_company_id', 'known_company_source'];

        foreach ($nullableFields as $field) {
            if ($this->has($field) && ($this->input($field) === '' || $this->input($field) === null)) {
                $this->merge([$field => null]);
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $tenantId = Auth::user()->tenant_id;
        $customerId = $this->route('customer') ? $this->route('customer')->id : null;

        $rules = [
            'type' => ['required', 'in:individual,corporate'],
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                // Ensure email is unique within the tenant, excluding current customer if editing
                'unique:customers,email,'.$customerId.',id,tenant_id,'.$tenantId,
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'in:male,female,other'],
            'occupation' => ['nullable', 'string', 'max:255'],
            'annual_income' => ['nullable', 'numeric', 'min:0'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'logo_upload' => ['nullable', 'image', 'mimes:jpeg,png,jpg', 'max:2048'],
            'is_active' => ['required', 'boolean'],
            'known_company_id' => ['nullable', 'string'],
            'known_company_source' => ['nullable', 'string'],
        ];

        // Company name is required for corporate customers
        if ($this->type === 'corporate') {
            $rules['company_name'] = ['required', 'string', 'max:255'];
        }

        // Name is required for individual customers
        if ($this->type === 'individual') {
            $rules['first_name'] = ['required', 'string', 'max:255'];
            $rules['last_name'] = ['required', 'string', 'max:255'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'type.required' => 'Please select customer type.',
            'first_name.required' => 'First name is required for individual customers.',
            'last_name.required' => 'Last name is required for individual customers.',
            'company_name.required' => 'Company name is required for corporate customers.',
            'email.unique' => 'A customer with this email already exists in your account.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        if ($this->header('X-Quick-Create') === 'true') {
            throw new HttpResponseException(response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422));
        }

        parent::failedValidation($validator);
    }
}
