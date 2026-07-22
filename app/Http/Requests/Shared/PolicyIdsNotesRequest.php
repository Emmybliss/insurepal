<?php

namespace App\Http\Requests\Shared;

use Illuminate\Foundation\Http\FormRequest;

class PolicyIdsNotesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'policy_ids' => ['required', 'array'],
            'policy_ids.*' => ['exists:policies,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
