<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'content' => 'required|string|min:10',
            'type' => 'required|in:general,maintenance,update,security,feature',
            'priority' => 'required|in:low,medium,high',
            'expires_at' => 'nullable|date|after:now',
            'is_active' => 'boolean',
        ];
    }
}
