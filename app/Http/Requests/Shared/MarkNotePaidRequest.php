<?php

namespace App\Http\Requests\Shared;

use Illuminate\Foundation\Http\FormRequest;

class MarkNotePaidRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_date' => ['required', 'date', 'before_or_equal:today'],
            'payment_reference' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'payment_date.required' => 'The payment date is required.',
            'payment_date.before_or_equal' => 'Payment date cannot be in the future.',
        ];
    }
}
