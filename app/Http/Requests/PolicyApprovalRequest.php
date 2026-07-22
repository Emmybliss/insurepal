<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PolicyApprovalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'action' => ['required', 'string', 'in:approve,reject,bulk-approve'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'policy_ids' => ['required_if:action,bulk-approve', 'nullable', 'array'],
            'policy_ids.*' => ['integer', 'exists:policies,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'action.required' => 'The approval action is required.',
            'action.in' => 'The action must be approve, reject, or bulk-approve.',
            'policy_ids.required_if' => 'Policy IDs are required for bulk approval.',
        ];
    }
}
