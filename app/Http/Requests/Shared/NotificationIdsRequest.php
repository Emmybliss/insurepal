<?php

namespace App\Http\Requests\Shared;

use Illuminate\Foundation\Http\FormRequest;

class NotificationIdsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'notification_ids' => ['required', 'array'],
            'notification_ids.*' => ['integer', 'exists:app_notifications,id'],
        ];
    }
}
