<?php

namespace App\Http\Requests\Shared;

use Illuminate\Foundation\Http\FormRequest;

class AddClaimCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'min:1'],
            'is_internal' => ['boolean'],
            'parent_id' => ['nullable', 'exists:claim_comments,id'],
        ];
    }
}
