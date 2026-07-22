<?php

namespace App\Http\Requests\Shared;

use Illuminate\Foundation\Http\FormRequest;

class BulkActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'action' => ['required', 'string', 'in:delete,restore,forceDelete,approve,reject,cancel,archive,markAsRead,markAsUnread'],
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:users,id'],
            'filters' => ['nullable', 'array'],
        ];
    }
}
