<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMarketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'insurance_company_id' => ['sometimes', 'exists:insurance_companies,id'],
            'insurer_branch' => ['nullable', 'string', 'max:100'],
            'contact_person' => ['nullable', 'string', 'max:100'],
            'contact_email' => ['nullable', 'email', 'max:100'],
            'is_lead' => ['nullable', 'boolean'],
            'participation_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'offered_rate' => ['nullable', 'numeric', 'min:0'],
            'rate_basis' => ['nullable', 'string', 'in:percentage,per_mille,fixed'],
            'gross_premium' => ['nullable', 'numeric', 'min:0'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'status' => ['nullable', 'string', 'in:pending,accepted,countered,declined,withdrawn'],
            'response_notes' => ['nullable', 'string'],
        ];
    }
}
