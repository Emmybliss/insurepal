<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerKycRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'identity_type' => 'nullable|string|max:100',
            'identity_number' => 'nullable|string|max:100',
            'nin' => 'nullable|string|max:20',
            'bvn' => 'nullable|string|max:20',
            'identity_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'address_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ];
    }
}
