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
        ];
    }
}
