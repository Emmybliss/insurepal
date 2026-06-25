<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules;

class SubscriberRegistrationRequest extends FormRequest
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
            'type' => ['required', 'in:underwriter,broker'],
            'company_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:tenants,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:1000'],
            'admin_name' => ['required', 'string', 'max:255'],
            'admin_email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'cf-turnstile-response' => ['required', 'string', new \App\Rules\Turnstile],
            'known_company_id' => ['nullable', 'integer'],
            'known_company_source' => ['nullable', 'string', 'max:50'],
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'type.required' => 'Please select your account type.',
            'type.in' => 'Invalid account type selected.',
            'company_name.required' => 'Company name is required.',
            'email.unique' => 'A company with this email address is already registered.',
            'admin_email.unique' => 'A user with this email address already exists.',
            'password.confirmed' => 'The password confirmation does not match.',
            'cf-turnstile-response.required' => 'Please complete the security check to verify you are human.',
        ];
    }

    /**
     * Get custom attribute names.
     */
    public function attributes(): array
    {
        return [
            'admin_name' => 'administrator name',
            'admin_email' => 'administrator email',
        ];
    }
}
