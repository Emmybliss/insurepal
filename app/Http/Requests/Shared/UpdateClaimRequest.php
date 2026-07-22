<?php

namespace App\Http\Requests\Shared;

use App\Models\Claim;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClaimRequest extends FormRequest
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
        ];
    }
}
