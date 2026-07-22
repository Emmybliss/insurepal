<?php

namespace App\Http\Requests\Shared;

use Illuminate\Foundation\Http\FormRequest;

class MessageIdsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'message_ids' => ['required', 'array'],
            'message_ids.*' => ['integer', 'exists:messages,id'],
        ];
    }
}
