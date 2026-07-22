<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StorePlacementMarketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->tenant_id;
    }

    public function rules(): array
    {
        $tenantId = Auth::user()->tenant_id;

        return [
            'insurance_company_id' => ['required', 'integer', Rule::exists('insurance_companies', 'id')],
            'insurer_branch' => ['nullable', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'is_lead' => ['nullable', 'boolean'],
            'participation_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'offered_rate' => ['nullable', 'numeric', 'min:0'],
            'rate_basis' => ['nullable', 'string', 'max:255'],
            'gross_premium' => ['nullable', 'numeric', 'min:0'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'commission_amount' => ['nullable', 'numeric', 'min:0'],
            'co_broker_commission' => ['nullable', 'numeric', 'min:0'],
            'reporting_broker_commission' => ['nullable', 'numeric', 'min:0'],
            'fees' => ['nullable', 'numeric', 'min:0'],
            'taxes' => ['nullable', 'numeric', 'min:0'],
            'net_premium' => ['nullable', 'numeric', 'min:0'],
            'response_notes' => ['nullable', 'string'],
            'insurer_reference' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'insurance_company_id.required' => 'Please select an insurance company.',
        ];
    }
}
