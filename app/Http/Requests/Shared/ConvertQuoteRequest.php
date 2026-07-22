<?php

namespace App\Http\Requests\Shared;

use Illuminate\Foundation\Http\FormRequest;

class ConvertQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'quote_id' => ['required', 'integer', 'exists:quotes,id'],
            'additional_data' => ['nullable', 'array'],
        ];
    }
}
