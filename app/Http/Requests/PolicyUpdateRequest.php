<?php

namespace App\Http\Requests;

use App\Models\Policy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PolicyUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Middleware handles this
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in([
                Policy::STATUS_DRAFT,
                Policy::STATUS_PENDING_APPROVAL,
                Policy::STATUS_APPROVED,
                Policy::STATUS_ACTIVE,
                Policy::STATUS_EXPIRED,
                Policy::STATUS_CANCELLED,
                Policy::STATUS_SUSPENDED,
                Policy::STATUS_REJECTED,
                Policy::STATUS_RECORDED,
            ])],
            'expiry_date' => ['required', 'date'],
            'effective_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'internal_notes' => ['nullable', 'string', 'max:2000'],
            'insurer_id' => ['nullable', 'string'],
            'insurer_source' => ['nullable', 'string'],
            'insurer_name' => ['nullable', 'string'],
            'insurer_address' => ['nullable', 'string'],
            'insurer_email' => ['nullable', 'string'],
            'insurer_phone' => ['nullable', 'string'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'broker_slip_number' => ['nullable', 'string', 'max:255'],
            'placement_date' => ['nullable', 'date'],
            'premium_amount' => ['nullable', 'numeric', 'min:0'],
            'commission_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_frequency' => ['nullable', 'string', 'max:50'],
            'schedule_file' => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240'],
            'broker_slip_file' => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240'],
            'risks' => ['nullable', 'array'],
            'risks.*.description' => ['nullable', 'string', 'max:1000'],
            'risks.*.coverage_amount' => ['required_with:risks', 'numeric', 'min:0'],
            'risks.*.rate' => ['nullable', 'numeric', 'min:0'],
            'risks.*.rate_basis' => ['nullable', 'string', 'in:percentage,per_mille,fixed'],
            'risks.*.premium' => ['required_with:risks', 'numeric', 'min:0'],
            'risks.*.dynamic_fields' => ['nullable', 'array'],
        ];
    }
}
