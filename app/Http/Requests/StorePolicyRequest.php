<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'quote_id' => 'required|exists:quotes,id',
            'effective_date' => 'required|date|after_or_equal:today',
            'expiry_date' => 'required|date|after:effective_date',
            'payment_frequency' => ['required', Rule::in(['monthly', 'quarterly', 'semi_annual', 'annual'])],
        ];
    }
}
