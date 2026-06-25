<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TenantRegistrationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email', 'unique:tenants,email'],
            'password' => ['required', 'confirmed', 'min:8'],
            'company_name' => ['required', 'string', 'max:255'],
            'tenant_type' => ['required', 'in:underwriter,broker'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'cf-turnstile-response' => ['required', 'string', new \App\Rules\Turnstile],
        ];
    }

    public function messages(): array
    {
        return [
            'tenant_type.required' => 'Please select your business type.',
            'tenant_type.in' => 'Please select either Underwriter or Broker.',
            'email.unique' => 'An account with this email address already exists.',
            'cf-turnstile-response.required' => 'Please complete the security check to verify you are human.',
        ];
    }
}
