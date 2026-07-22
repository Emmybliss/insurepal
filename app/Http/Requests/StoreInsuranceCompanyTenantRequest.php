<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInsuranceCompanyTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'insurance_company_id' => ['required', 'exists:insurance_companies,id'],
            'insurance_company_branch_id' => [
                'nullable',
                'exists:insurance_company_branches,id',
            ],
            'reference_code' => ['nullable', 'string', 'max:100'],
            'is_preferred' => ['boolean'],
        ];
    }
}
