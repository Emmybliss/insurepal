<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class AddClaimCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->tenant_id;
    }

    public function rules(): array
    {
        return [
            'body' => [
                'required',
                'string',
                'min:1',
            ],
            'is_internal' => [
                'nullable',
                'boolean',
            ],
            'parent_id' => [
                'nullable',
                'integer',
                'exists:claim_comments,id',
            ],
        ];
    }
}
