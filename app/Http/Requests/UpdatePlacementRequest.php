<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePlacementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['sometimes', 'exists:customers,id'],
            'insured_id' => ['nullable', 'exists:customers,id'],
            'policy_product_id' => ['sometimes', 'exists:policy_products,id'],
            'currency' => ['nullable', 'string', 'size:3'],
            'proposed_start_date' => ['sometimes', 'date'],
            'proposed_end_date' => ['sometimes', 'date', 'after:proposed_start_date'],
            'total_sum_insured' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'risk_details' => ['nullable', 'array'],
            'markets' => ['nullable', 'array'],
            'markets.*.insurance_company_id' => ['required', 'string'],
            'markets.*.participation_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'markets.*.status' => ['nullable', 'string'],
            'markets.*.response_notes' => ['nullable', 'string'],
        ];
    }
}
