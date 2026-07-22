<?php

namespace App\Http\Requests\Shared;

use Illuminate\Foundation\Http\FormRequest;

class StoreNoteFromPolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:1000'],
            'due_date' => ['nullable', 'date', 'after_or_equal:today'],
            'items' => ['nullable', 'array'],
        ];
    }
}
