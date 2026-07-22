<?php

namespace App\Http\Requests\Shared;

use Illuminate\Foundation\Http\FormRequest;

class GenerateNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'template_key' => ['required', 'string'],
            'type' => ['sometimes', 'string'],
            'options' => ['sometimes', 'array'],
        ];
    }
}
