<?php

namespace App\Http\Requests\Api\V1;

use App\Models\Claim;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateClaimRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->tenant_id;
    }

    public function rules(): array
    {
        return [
            'claim_type' => [
                'sometimes',
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
                'sometimes',
                'date',
                'before_or_equal:today',
            ],
            'incident_description' => [
                'sometimes',
                'string',
                'min:10',
            ],
            'incident_location' => [
                'nullable',
                'string',
                'max:255',
            ],
            'claim_amount' => [
                'sometimes',
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
            'claim_type.in' => 'The selected claim type is invalid.',
            'incident_date.before_or_equal' => 'Incident date cannot be in the future.',
            'incident_description.min' => 'Incident description must be at least 10 characters.',
            'claim_amount.min' => 'Claim amount must be greater than or equal to 0.',
        ];
    }
}
