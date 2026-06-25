<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInsuranceCompanyBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $branchId = $this->route('branch')?->id ?? $this->route('insurance_company_branch')?->id;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                $this->route('insurance_company')
                    ? sprintf('unique:insurance_company_branches,name,NULL,id,insurance_company_id,%s', $this->route('insurance_company')->id)
                    : 'unique:insurance_company_branches,name',
            ],
            'code' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'A branch with this name already exists for this insurance company.',
        ];
    }
}
