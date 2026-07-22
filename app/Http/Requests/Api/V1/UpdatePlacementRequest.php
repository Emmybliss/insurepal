<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdatePlacementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->tenant_id;
    }

    public function rules(): array
    {
        $tenantId = Auth::user()->tenant_id;

        return [
            'customer_id' => ['sometimes', 'integer', Rule::exists('customers', 'id')->where('tenant_id', $tenantId)],
            'insured_id' => ['nullable', 'integer', Rule::exists('customers', 'id')->where('tenant_id', $tenantId)],
            'policy_product_id' => ['sometimes', 'integer', Rule::exists('policy_products', 'id')->where('tenant_id', $tenantId)],
            'currency' => ['nullable', 'string', 'size:3'],
            'proposed_start_date' => ['sometimes', 'date'],
            'proposed_end_date' => ['sometimes', 'date', 'after:proposed_start_date'],
            'total_sum_insured' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'risk_details' => ['nullable', 'array'],
        ];
    }
}
