<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateBrokerSlipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->tenant_id;
    }

    public function rules(): array
    {
        return [
            'currency' => ['nullable', 'string', 'size:3'],
            'period_start' => ['sometimes', 'date'],
            'period_end' => ['sometimes', 'date', 'after:period_start'],
            'claim_payment_condition' => ['nullable', 'string'],
            'risks' => ['nullable', 'array'],
            'risks.*.policy_class_id' => ['nullable', 'exists:policy_classes,id'],
            'risks.*.policy_product_id' => ['nullable', 'exists:policy_products,id'],
            'risks.*.description' => ['nullable', 'string'],
            'risks.*.coverage_amount' => ['required_with:risks', 'numeric', 'min:0'],
            'risks.*.premium' => ['nullable', 'numeric', 'min:0'],
            'risks.*.net_premium' => ['nullable', 'numeric', 'min:0'],
            'risks.*.rate' => ['nullable', 'numeric', 'min:0'],
            'risks.*.rate_basis' => ['nullable', 'string', 'max:20'],
            'risks.*.commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'risks.*.commission_amount' => ['nullable', 'numeric', 'min:0'],
            'risks.*.taxes' => ['nullable', 'numeric', 'min:0'],
            'risks.*.fees' => ['nullable', 'numeric', 'min:0'],
            'risks.*.dynamic_fields' => ['nullable', 'array'],
            'risks.*.inception_date' => ['nullable', 'date'],
            'risks.*.expiry_date' => ['nullable', 'date', 'after_or_equal:risks.*.inception_date'],
            'items' => ['nullable', 'array'],
            'clauses' => ['nullable', 'array'],
            'clauses.*.clause_type' => ['required_with:clauses', 'string', 'max:255'],
            'clauses.*.title' => ['required_with:clauses', 'string', 'max:200'],
            'clauses.*.content' => ['required_with:clauses', 'string'],
            'clauses.*.is_standard' => ['nullable', 'boolean'],
            'clauses.*.sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
