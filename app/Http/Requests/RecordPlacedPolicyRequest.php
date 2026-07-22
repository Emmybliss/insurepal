<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecordPlacedPolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => 'required|exists:customers,id',
            'policy_type_id' => 'nullable|exists:policy_types,id',
            'policy_class_id' => 'nullable|exists:policy_classes,id',
            'policy_product_id' => 'required|exists:policy_products,id',
            'policy_number' => ['required', 'string', 'max:100', Rule::unique('policies', 'policy_number')->where('tenant_id', $this->user()->tenant_id)],
            'broker_slip_number' => 'nullable|string|max:100',
            'placement_date' => 'required|date',
            'insurer_id' => 'nullable|integer',
            'insurer_name' => 'required|string',
            'effective_date' => 'required|date',
            'expiry_date' => 'required|date|after:effective_date',
            'premium_amount' => 'required|numeric|min:0',
            'sum_insured' => 'nullable|numeric|min:0',
            'commission_amount' => 'nullable|numeric|min:0',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
            'currency' => 'nullable|string|max:3',
            'payment_method' => 'nullable|string|max:50',
            'payment_date' => 'nullable|date',
            'is_direct_to_insurer' => 'nullable|boolean',
            'coverage_details' => 'nullable|array',
            'payment_frequency' => ['nullable', Rule::in(['monthly', 'quarterly', 'semi_annual', 'annual'])],
            'notes' => 'nullable|string|max:1000',
            'schedule_file' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'broker_slip_file' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ];
    }

    public function messages(): array
    {
        return [
            'policy_number.unique' => 'This policy number is already in use.',
            'schedule_file.max' => 'Schedule must not exceed 10MB.',
            'schedule_file.mimes' => 'Schedule must be a PDF, document, or image.',
            'schedule_file.max' => 'Schedule must not exceed 10MB.',
        ];
    }
}
