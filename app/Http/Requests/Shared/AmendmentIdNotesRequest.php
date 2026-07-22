<?php

namespace App\Http\Requests\Shared;

use Illuminate\Foundation\Http\FormRequest;

class AmendmentIdNotesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amendment_id' => ['required', 'exists:policy_amendments,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
