<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMarketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'insurance_company_id' => ['required', 'exists:insurance_companies,id'],
            'insurer_branch' => ['nullable', 'string', 'max:100'],
            'contact_person' => ['nullable', 'string', 'max:100'],
            'contact_email' => ['nullable', 'email', 'max:100'],
            'is_lead' => ['nullable', 'boolean'],
            'participation_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
