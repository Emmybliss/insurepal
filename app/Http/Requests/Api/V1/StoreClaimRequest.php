<?php

namespace App\Http\Requests\Api\V1;

use App\Models\Claim;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreClaimRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->tenant_id;
    }

    public function rules(): array
    {
        $tenantId = Auth::user()->tenant_id;

        return [
            'policy_id' => [
                'required',
                'integer',
                Rule::exists('policies', 'id')->where('tenant_id', $tenantId),
            ],
            'customer_id' => [
                'required',
                'integer',
                Rule::exists('customers', 'id')->where('tenant_id', $tenantId),
            ],
            'claim_type' => [
                'required',
                'string',
                Rule::in([
                    Claim::TYPE_ACCIDENT,
                    Claim::TYPE_THEFT,
                    Claim::TYPE_DAMAGE,
                    Claim::TYPE_FIRE,
                    Claim::TYPE_FLOOD,
                    Claim::TYPE_MEDICAL,
                    Claim::TYPE_DEATH,
                    Claim::TYPE_DISABILITY,
                    Claim::TYPE_LIABILITY,
                    Claim::TYPE_OTHER,
                ]),
            ],
            'incident_date' => [
                'required',
                'date',
                'before_or_equal:today',
            ],
            'incident_description' => [
                'required',
                'string',
                'min:10',
            ],
            'incident_location' => [
                'nullable',
                'string',
                'max:255',
            ],
            'claim_amount' => [
                'required',
                'numeric',
                'min:0',
            ],
            'internal_notes' => [
                'nullable',
                'string',
                'max:2000',
            ],
            'metadata' => [
                'nullable',
                'array',
            ],
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
            'claim_type.in' => 'The selected claim type is invalid.',
            'incident_date.required' => 'Incident date is required.',
            'incident_date.before_or_equal' => 'Incident date cannot be in the future.',
            'incident_description.required' => 'Incident description is required.',
            'incident_description.min' => 'Incident description must be at least 10 characters.',
            'claim_amount.required' => 'Claim amount is required.',
            'claim_amount.min' => 'Claim amount must be greater than or equal to 0.',
        ];
    }
}
