<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('super_admin');
    }

    public function rules(): array
    {
        $tenantId = $this->route('tenant') ? $this->route('tenant')->id : null;

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z0-9\-]+$/',
                Rule::unique('tenants', 'slug')->ignore($tenantId),
            ],
            'type' => ['required', 'string', Rule::in(['underwriter', 'broker'])],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('tenants', 'email')->ignore($tenantId),
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:1000'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'logo' => ['nullable'],  // accepts both a string path (existing) and a file upload
            'status' => ['required', 'string', Rule::in(['active', 'inactive', 'suspended'])],
            'trial_ends_at' => ['nullable', 'date', 'after:now'],
            'known_company_id' => ['nullable', 'string', 'max:255'],
            'known_company_source' => ['nullable', 'string', 'max:255'],
            'default_locale' => ['nullable', 'string', 'max:10'],
            // Subscription
            'subscription_plan_id' => ['nullable', 'integer', 'exists:subscription_plans,id'],
            'subscription_duration' => ['required_if:subscription_plan_id,!null', 'string', Rule::in(['monthly', 'quarterly', 'semi_annually', 'yearly'])],
            'enable_trial' => ['nullable', 'boolean'],
            // Logo file upload — validated separately in controller
            'logo_upload' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
            // Settings
            'settings' => ['nullable', 'array'],
            'settings.company_profile' => ['nullable', 'array'],
            'settings.company_profile.cac_reg_number' => ['nullable', 'string', 'max:100'],
            'settings.company_profile.tax_number' => ['nullable', 'string', 'max:100'],
            'settings.company_profile.naicom_reg_number' => ['nullable', 'string', 'max:100'],
            'settings.company_profile.ncrib_reg_number' => ['nullable', 'string', 'max:100'],
            'settings.company_profile.website' => ['nullable', 'string', 'max:255'],
            'settings.billing' => ['nullable', 'array'],
            'settings.billing.currency' => ['nullable', 'string', 'max:3'],
            'settings.billing.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'settings.billing.payment_method' => ['nullable', 'string', Rule::in(['bank_transfer', 'card', 'paystack', 'flutterwave', 'cash', 'cheque', 'direct_debit'])],
            'settings.billing.discount_type' => ['nullable', 'string', Rule::in(['percentage', 'fixed'])],
            'settings.billing.discount_value' => ['nullable', 'numeric', 'min:0'],
            'settings.notifications' => ['nullable', 'array'],
            'settings.notifications.email_enabled' => ['nullable', 'boolean'],
            'settings.notifications.sms_enabled' => ['nullable', 'boolean'],
            // User account (optional, for create/edit)
            'user' => ['nullable', 'array'],
            'user.name' => ['nullable', 'string', 'max:255'],
            'user.email' => [
                'nullable',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->getUserId()),
            ],
            'user.password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'user.password_confirmation' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'The tenant name is required.',
            'name.max' => 'The tenant name cannot exceed 255 characters.',
            'slug.regex' => 'The slug can only contain lowercase letters, numbers, and hyphens.',
            'slug.unique' => 'This slug is already taken.',
            'type.required' => 'The tenant type is required.',
            'type.in' => 'The tenant type must be either underwriter or broker.',
            'email.required' => 'The email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'This email address is already registered.',
            'phone.max' => 'The phone number cannot exceed 20 characters.',
            'address.max' => 'The address cannot exceed 1000 characters.',
            'status.required' => 'The tenant status is required.',
            'status.in' => 'The status must be active, inactive, or suspended.',
            'trial_ends_at.date' => 'Please enter a valid trial end date.',
            'trial_ends_at.after' => 'The trial end date must be in the future.',
            'subscription_plan_id.exists' => 'The selected subscription plan is invalid.',
            'subscription_duration.required_if' => 'Please select a billing cycle when choosing a subscription plan.',
            'subscription_duration.in' => 'Billing cycle must be monthly, quarterly, semi-annually, or yearly.',
            'settings.company_profile.website.url' => 'Please enter a valid website URL.',
            'settings.billing.tax_rate.numeric' => 'Tax rate must be a number.',
            'settings.billing.tax_rate.min' => 'Tax rate cannot be negative.',
            'settings.billing.tax_rate.max' => 'Tax rate cannot exceed 100%.',
            'settings.billing.payment_method.in' => 'Please select a valid payment method.',
            'settings.billing.discount_value.numeric' => 'Discount value must be a number.',
            'settings.billing.discount_value.min' => 'Discount value cannot be negative.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('slug') && empty($this->slug)) {
            $this->merge([
                'slug' => \Illuminate\Support\Str::slug($this->name),
            ]);
        }

        if ($this->has('settings') && is_string($this->settings)) {
            $this->merge([
                'settings' => json_decode($this->settings, true) ?: [],
            ]);
        }
    }

    private function getUserId(): ?int
    {
        $tenant = $this->route('tenant');
        if (! $tenant) {
            return null;
        }

        $user = \App\Models\User::where('tenant_id', $tenant->id)->orderBy('id')->first();

        return $user?->id;
    }
}
