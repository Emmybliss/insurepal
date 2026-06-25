<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class MessageRequest extends FormRequest
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
            'recipients.*' => 'numeric', // We'll handle validation in the controller since recipients can be users or customers
            'priority' => 'required|in:low,medium,high',
            'attachments.*' => 'file|max:5120', // 5MB max per file
            'send' => 'sometimes|string', // Optional parameter to indicate if message should be sent
            'action' => 'sometimes|in:send,draft', // Explicit action parameter
        ];
    }

    public function messages(): array
    {
        return [
            'subject.required' => 'Subject is required.',
            'subject.max' => 'Subject cannot exceed 255 characters.',
            'body.required' => 'Message body is required.',
            'body.max' => 'Message body cannot exceed 10,000 characters.',
            'recipients.required' => 'At least one recipient is required.',
            'recipients.min' => 'At least one recipient is required.',
            'recipients.*.exists' => 'One or more selected recipients are invalid.',
            'priority.required' => 'Priority is required.',
            'priority.in' => 'Priority must be low, medium, or high.',
            'attachments.*.file' => 'Attachment must be a valid file.',
            'attachments.*.max' => 'Each attachment cannot exceed 5MB.',
        ];
    }

    public function prepareForValidation()
    {
        // Set default priority if not provided
        if (! $this->priority) {
            $this->merge([
                'priority' => 'medium',
            ]);
        }

        // Ensure recipients is an array
        if ($this->recipients && ! is_array($this->recipients)) {
            $this->merge([
                'recipients' => [$this->recipients],
            ]);
        }
    }
}
