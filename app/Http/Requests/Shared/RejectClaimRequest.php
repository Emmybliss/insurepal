<?php

namespace App\Http\Requests\Shared;

use Illuminate\Foundation\Http\FormRequest;

class RejectClaimRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'decision_notes' => ['required', 'string', 'min:10'],
        ];
    }

    public function messages(): array
    {
        return [
            'decision_notes.required' => 'Please provide a reason for rejection.',
            'decision_notes.min' => 'The rejection reason must be at least 10 characters.',
        ];
    }
}
