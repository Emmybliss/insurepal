<?php

namespace App\Http\Requests\Shared;

use Illuminate\Foundation\Http\FormRequest;

class PolicyIdNotesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'policy_id' => ['required', 'exists:policies,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
