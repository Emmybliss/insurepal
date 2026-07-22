<?php

namespace App\Http\Requests\Shared;

use App\Models\Claim;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClaimRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'policy_id' => [
                'required',
                'integer',
                Rule::exists('policies', 'id')->where('tenant_id', $this->user()->tenant_id),
            ],
            'customer_id' => [
                'required',
                'integer',
                Rule::exists('customers', 'id')->where('tenant_id', $this->user()->tenant_id),
            ],
            'claim_type' => [
                'required',
                'string',
                Rule::in([
                    Claim::TYPE_ACCIDENT, Claim::TYPE_THEFT, Claim::TYPE_DAMAGE,
                    Claim::TYPE_FIRE, Claim::TYPE_FLOOD, Claim::TYPE_MEDICAL,
                    Claim::TYPE_DEATH, Claim::TYPE_DISABILITY, Claim::TYPE_LIABILITY,
                    Claim::TYPE_OTHER,
                ]),
            ],
            'incident_date' => ['required', 'date', 'before_or_equal:today'],
            'incident_description' => ['required', 'string', 'min:10'],
            'incident_location' => ['nullable', 'string', 'max:255'],
            'claim_amount' => ['required', 'numeric', 'min:0'],
            'documents' => ['nullable', 'array'],
            'documents.*' => ['file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'policy_id.required' => 'Please select a policy.',
            'policy_id.exists' => 'The selected policy is invalid or does not belong to your organization.',
            'customer_id.required' => 'Please select a customer.',
            'customer_id.exists' => 'The selected customer is invalid or does not belong to your organization.',
            'claim_type.required' => 'Please select a claim type.',
            'incident_date.required' => 'Incident date is required.',
            'incident_date.before_or_equal' => 'Incident date cannot be in the future.',
            'incident_description.required' => 'Incident description is required.',
            'incident_description.min' => 'Incident description must be at least 10 characters.',
            'claim_amount.required' => 'Claim amount is required.',
            'claim_amount.min' => 'Claim amount must be greater than or equal to 0.',
        ];
    }
}
