<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_name' => 'required|string|max:255',
            'type' => 'required|in:underwriter,broker',
            'address' => 'required|string|max:500',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'country' => 'required|string|max:100',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:255',
            'naicom_reg_number' => 'nullable|string|max:100',
            'rc_number' => 'nullable|string|max:100',
            'website' => 'nullable|url|max:255',
            'known_company_id' => 'nullable|integer',
            'known_company_source' => 'nullable|string|max:50',
        ];
    }
}
