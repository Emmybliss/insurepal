<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class CompanySettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'required|string',
            'city' => 'required|string|max:255',
            'state' => 'required|string|max:255',
            'country' => 'required|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'website' => 'nullable|url|max:255',
            'registration_number' => 'nullable|string|max:255',
            'tax_id' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'naicom_reg_number' => 'nullable|string|max:255',
            'rc_number' => 'nullable|string|max:255',
            'slogan' => 'nullable|string|max:255',
            'logo' => 'nullable|image|max:20480',
            'signature' => 'nullable|image|max:10240',
            'stamp' => 'nullable|image|max:10240',
            'header_image' => 'nullable|image|max:20480',
            'footer_image' => 'nullable|image|max:20480',
            'paystack_public_key' => 'nullable|string|max:255',
            'paystack_secret_key' => 'nullable|string|max:255',
            'primary_color' => 'nullable|string|regex:/^#[a-fA-F0-9]{6}$/',
            'secondary_color' => 'nullable|string|regex:/^#[a-fA-F0-9]{6}$/',
            'accent_color' => 'nullable|string|regex:/^#[a-fA-F0-9]{6}$/',
            'sidebar_style' => 'nullable|string|in:solid,gradient,transparent',
        ];
    }
}
