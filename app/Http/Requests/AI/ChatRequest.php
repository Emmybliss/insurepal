<?php

namespace App\Http\Requests\AI;

use Illuminate\Foundation\Http\FormRequest;

class ChatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'message' => ['required', 'string', 'max:10000'],
            'conversation_id' => ['nullable', 'integer', 'exists:ai_conversations,id'],
            'context_type' => ['nullable', 'string', 'in:customer,policy,claim,quote'],
            'context_id' => ['required_with:context_type', 'integer', 'nullable'],
            'stream' => ['boolean'],
        ];
    }
}
