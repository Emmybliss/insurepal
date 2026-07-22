<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreBrokerSlipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->tenant_id;
    }

    public function rules(): array
    {
        $tenantId = Auth::user()->tenant_id;

        return [
            'placement_id' => ['required', 'integer', Rule::exists('placements', 'id')->where('tenant_id', $tenantId)],
            'placement_market_id' => ['nullable', 'integer', Rule::exists('placement_markets', 'id')->where('tenant_id', $tenantId)],
            'currency' => ['nullable', 'string', 'size:3'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after:period_start'],
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

    public function messages(): array
    {
        return [
            'placement_id.required' => 'Please select a placement.',
            'placement_id.exists' => 'The selected placement is invalid or does not belong to your organization.',
            'period_start.required' => 'Period start is required.',
            'period_end.required' => 'Period end is required.',
            'period_end.after' => 'Period end must be after period start.',
        ];
    }
}
