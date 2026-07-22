<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreSupportTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->tenant_id;
    }

    public function rules(): array
    {
        $tenantId = Auth::user()->tenant_id;

        return [
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:10000'],
            'priority' => ['required', 'string', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'category' => ['required', 'string', Rule::in(['technical', 'billing', 'general', 'feature_request', 'bug_report'])],
            'assignee_id' => ['nullable', 'integer', Rule::exists('users', 'id')->where('tenant_id', $tenantId)],
        ];
    }

    public function messages(): array
    {
        return [
            'subject.required' => 'Please provide a ticket subject.',
            'description.required' => 'Please provide a ticket description.',
            'priority.required' => 'Please select a priority level.',
            'priority.in' => 'Priority must be low, medium, high, or urgent.',
            'category.required' => 'Please select a category.',
            'category.in' => 'Category must be technical, billing, general, feature_request, or bug_report.',
        ];
    }
}
