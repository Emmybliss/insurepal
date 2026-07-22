<?php

namespace App\Http\Requests\Mobile;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateClaimRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'incident_date' => ['sometimes', 'date'],
            'incident_description' => ['sometimes', 'string', 'max:2000'],
            'incident_location' => ['nullable', 'string', 'max:500'],
            'claim_amount' => ['sometimes', 'numeric', 'min:0'],
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
