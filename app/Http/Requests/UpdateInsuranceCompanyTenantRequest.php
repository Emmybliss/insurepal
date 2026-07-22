<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInsuranceCompanyTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reference_code' => ['nullable', 'string', 'max:100'],
            'is_preferred' => ['boolean'],
        ];
    }
}
