<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InboxActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'thread_ids' => 'required|array',
            'thread_ids.*' => 'exists:communication_threads,id',
            'action' => 'required|in:read,unread,delete,archive',
        ];
    }
}
