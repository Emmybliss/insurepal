<?php

namespace App\Http\Requests\Shared;

use Illuminate\Foundation\Http\FormRequest;

class EndorsementRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'amendment_type' => ['required', 'string', 'in:coverage_change,premium_adjustment,beneficiary_change,policy_details_update,term_extension,endorsement,correction'],
            'amendment_reason' => ['required', 'string', 'max:1000'],
            'effective_date' => ['required', 'date', 'after_or_equal:today'],
            'customer_notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
