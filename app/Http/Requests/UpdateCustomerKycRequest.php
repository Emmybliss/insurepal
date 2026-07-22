<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerKycRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => 'required|in:pending,verified,rejected',
            'identity_type' => 'nullable|string|max:100',
            'identity_number' => 'nullable|string|max:100',
            'nin' => 'nullable|string|max:20',
            'bvn' => 'nullable|string|max:20',
            'notes' => 'nullable|string|max:2000',
            'identity_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'address_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ];
    }
}
