<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateSupportTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->tenant_id;
    }

    public function rules(): array
    {
        $tenantId = Auth::user()->tenant_id;

        return [
            'subject' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string', 'max:10000'],
            'priority' => ['sometimes', 'string', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'category' => ['sometimes', 'string', Rule::in(['technical', 'billing', 'general', 'feature_request', 'bug_report'])],
            'assignee_id' => ['nullable', 'integer', Rule::exists('users', 'id')->where('tenant_id', $tenantId)],
        ];
    }
}
