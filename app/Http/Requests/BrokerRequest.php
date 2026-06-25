<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BrokerRequest extends FormRequest
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
        $brokerId = $this->route('broker')?->id;
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            // Broker Company Information
            'company_name' => ['required', 'string', 'max:255'],
            'contact_email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('tenants', 'contact_email')->ignore($brokerId),
            ],
            'contact_phone' => ['required', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:100'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'known_company_id' => ['nullable', 'integer'],
            'known_company_source' => ['nullable', 'string', 'max:50'],

            // Commission and Payment Settings
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:50'],
            'payment_terms' => ['nullable', 'integer', 'min:1', 'max:365'],

            // Primary Contact/User Information
            'primary_contact_name' => ['required', 'string', 'max:255'],
            'primary_contact_email' => [
                'required',
                'email',
                'max:255',
                function ($attribute, $value, $fail) use ($brokerId, $isUpdate) {
                    // Check if email exists in users table
                    $existingUser = \App\Models\User::where('email', $value);

                    if ($isUpdate && $brokerId) {
                        // For updates, exclude the current broker's primary user
                        $currentBrokerUsers = \App\Models\Tenant::find($brokerId)?->users()->pluck('id')->toArray();
                        if ($currentBrokerUsers) {
                            $existingUser->whereNotIn('id', $currentBrokerUsers);
                        }
                    }

                    if ($existingUser->exists()) {
                        $fail('This email is already registered to another user.');
                    }
                },
            ],
            'password' => [
                'nullable',
                'string',
                'min:6',
                'max:255',
            ],
            'password_confirmation' => [
                'nullable',
                'required_with:password',
                'same:password',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'company_name.required' => 'The company name is required.',
            'contact_email.required' => 'The company email address is required.',
            'contact_email.unique' => 'This email address is already registered to another broker.',
            'contact_phone.required' => 'The company phone number is required.',
            'commission_rate.numeric' => 'The commission rate must be a valid percentage.',
            'commission_rate.max' => 'The commission rate cannot exceed 50%.',
            'payment_terms.integer' => 'Payment terms must be a valid number of days.',
            'payment_terms.max' => 'Payment terms cannot exceed 365 days.',
            'primary_contact_name.required' => 'The primary contact name is required.',
            'primary_contact_email.required' => 'The primary contact email is required.',
            'primary_contact_email.email' => 'Please enter a valid email address.',
            'password.min' => 'The password must be at least 6 characters.',
            'password_confirmation.required_with' => 'Please confirm the password.',
            'password_confirmation.same' => 'The password confirmation does not match.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'company_name' => 'company name',
            'contact_email' => 'company email',
            'contact_phone' => 'company phone',
            'commission_rate' => 'commission rate',
            'payment_terms' => 'payment terms',
            'primary_contact_name' => 'primary contact name',
            'primary_contact_email' => 'primary contact email',
            'password_confirmation' => 'password confirmation',
        ];
    }
}
