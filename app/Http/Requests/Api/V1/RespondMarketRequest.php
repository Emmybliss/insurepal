<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class RespondMarketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:accepted,declined,countered,withdrawn'],
            'response_notes' => ['nullable', 'string'],
            'insurer_reference' => ['nullable', 'string', 'max:255'],
        ];
    }
}
