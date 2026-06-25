<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SupportTicketRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Available to all authenticated users
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'subject' => 'required|string|max:255',
            'description' => 'required|string|min:10',
            'category' => 'required|string|in:technical,billing,general,feature_request,bug_report',
            'priority' => 'required|string|in:low,medium,high,urgent',
            'assignee_id' => 'nullable|integer|exists:users,id',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'subject.required' => 'Please enter a subject for the ticket.',
            'subject.max' => 'Subject cannot exceed 255 characters.',
            'description.required' => 'Please provide a description of the issue.',
            'description.min' => 'Description must be at least 10 characters long.',
            'category.required' => 'Please select a category for the ticket.',
            'category.in' => 'Invalid category selected.',
            'priority.required' => 'Please select a priority level.',
            'priority.in' => 'Invalid priority level selected.',
            'assignee_id.exists' => 'Selected assignee is invalid.',
        ];
    }
}
