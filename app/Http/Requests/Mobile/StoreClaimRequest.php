<?php

namespace App\Http\Requests\Mobile;

use App\Models\Claim;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
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
            'policy_id' => ['required', 'exists:policies,id'],
            'customer_id' => ['required', 'exists:customers,id'],
            'claim_type' => ['required', Rule::in([
                Claim::TYPE_ACCIDENT,
                Claim::TYPE_THEFT,
                Claim::TYPE_DAMAGE,
                Claim::TYPE_FIRE,
                Claim::TYPE_FLOOD,
                Claim::TYPE_LIABILITY,
                Claim::TYPE_HEALTH,
                Claim::TYPE_OTHER,
            ])],
            'incident_date' => ['required', 'date'],
            'incident_description' => ['required', 'string', 'max:2000'],
            'incident_location' => ['nullable', 'string', 'max:500'],
            'claim_amount' => ['required', 'numeric', 'min:0'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $validator->errors(),
        ], 422));
    }
}
