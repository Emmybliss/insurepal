<?php

namespace App\Http\Requests\Shared;

use Illuminate\Foundation\Http\FormRequest;

class ApproveClaimRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'approved_amount' => [
                'required',
                'numeric',
                'min:0',
            ],
            'decision_notes' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'approved_amount.required' => 'The approved amount is required.',
            'approved_amount.numeric' => 'The approved amount must be a number.',
            'approved_amount.min' => 'The approved amount must be at least 0.',
        ];
    }
}
