<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'exists:customers,id'],
            'insurance_product_id' => ['nullable', 'exists:policy_products,id'],
            'policy_class_id' => ['nullable', 'exists:policy_classes,id'],
            'currency' => ['nullable', 'string', 'size:3'],
            'period_start' => ['nullable', 'date'],
            'period_end' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date'],
            'claim_payment_condition' => ['nullable', 'string'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'fees' => ['nullable', 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'internal_notes' => ['nullable', 'string'],
            'coverage_details' => ['nullable', 'array'],
            'form_data' => ['nullable', 'array'],
            'risks' => ['nullable', 'array'],
            'risks.*.policy_class_id' => ['nullable', 'exists:policy_classes,id'],
            'risks.*.policy_product_id' => ['nullable', 'exists:policy_products,id'],
            'risks.*.description' => ['nullable', 'string'],
            'risks.*.coverage_amount' => ['required_with:risks', 'numeric', 'min:0'],
            'risks.*.premium' => ['nullable', 'numeric', 'min:0'],
            'risks.*.rate' => ['nullable', 'numeric', 'min:0'],
            'risks.*.rate_basis' => ['nullable', 'string', 'max:20'],
            'risks.*.dynamic_fields' => ['nullable', 'array'],
            'risks.*.inception_date' => ['nullable', 'date'],
            'risks.*.expiry_date' => ['nullable', 'date'],
            'items' => ['nullable', 'array'],
            'clauses' => ['nullable', 'array'],
            'clauses.*.clause_type' => ['required_with:clauses', 'string'],
            'clauses.*.title' => ['required_with:clauses', 'string', 'max:200'],
            'clauses.*.content' => ['required_with:clauses', 'string'],
        ];
    }
}
