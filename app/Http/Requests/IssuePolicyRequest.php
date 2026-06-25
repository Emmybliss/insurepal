<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IssuePolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => 'required|exists:customers,id',
            'policy_product_id' => 'required|exists:policy_products,id',
            'policy_class_id' => 'nullable|exists:policy_classes,id',
            'policy_type_id' => 'nullable|exists:policy_types,id',
            'effective_date' => 'required|date|after_or_equal:today',
            'expiry_date' => 'required|date|after:effective_date',
            'premium_amount' => 'required|numeric|min:0',
            'commission_amount' => 'nullable|numeric|min:0',
            'coverage_details' => 'required|array',
            'payment_frequency' => ['required', Rule::in(['monthly', 'quarterly', 'semi_annual', 'annual'])],
            'form_data' => 'nullable|array',
            'notes' => 'nullable|string|max:1000',
            'insurer_id' => 'nullable|string',
            'insurer_source' => 'nullable|string',
            'insurer_name' => 'nullable|string',
            'insurer_address' => 'nullable|string',
            'insurer_email' => 'nullable|string',
            'insurer_phone' => 'nullable|string',
        ];
    }
}
