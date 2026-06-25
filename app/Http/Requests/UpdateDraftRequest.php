<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateDraftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'subject' => 'required|string|max:255',
            'body' => 'required|string|max:10000',
            'recipients' => 'required|array|min:1',
            'recipients.*' => 'integer|exists:users,id',
            'cc' => 'nullable|array',
            'cc.*' => 'integer|exists:users,id',
            'bcc' => 'nullable|array',
            'bcc.*' => 'integer|exists:users,id',
            'priority' => 'nullable|in:low,normal,high,urgent',
            'attachments.*' => 'file|max:5120',
            'send' => 'sometimes|boolean',
            'action' => 'sometimes|in:send,draft,update',
        ];
    }

    public function messages(): array
    {
        return [
            'subject.required' => 'Subject is required for email messages.',
            'subject.max' => 'Subject cannot exceed 255 characters.',
            'body.required' => 'Message body is required.',
            'body.max' => 'Message body cannot exceed 10,000 characters.',
            'recipients.required' => 'At least one recipient is required.',
            'attachments.*.max' => 'Each attachment cannot exceed 5MB.',
        ];
    }

    public function prepareForValidation()
    {
        if (! $this->priority) {
            $this->merge(['priority' => 'normal']);
        }
    }

    public function shouldSend(): bool
    {
        return $this->boolean('send')
            || $this->input('action') === 'send'
            || $this->filled('send');
    }
}
