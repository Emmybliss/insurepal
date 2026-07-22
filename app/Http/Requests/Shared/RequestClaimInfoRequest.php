<?php

namespace App\Http\Requests\Shared;

use Illuminate\Foundation\Http\FormRequest;

class RequestClaimInfoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'message' => ['required', 'string', 'min:10'],
        ];
    }

    public function messages(): array
    {
        return [
            'message.required' => 'Please provide a message requesting additional information.',
            'message.min' => 'The message must be at least 10 characters.',
        ];
    }
}
