<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PolicyWorkflowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return match ($this->route()->getActionMethod()) {
            'submitForApproval' => [
                'notes' => ['nullable', 'string', 'max:2000'],
            ],
            'approve' => [
                'notes' => ['nullable', 'string', 'max:2000'],
            ],
            'reject' => [
                'reason' => ['required', 'string', 'max:2000'],
            ],
            'issue' => [
                'policy_id' => ['required', 'exists:policies,id'],
            ],
            'cancel' => [
                'reason' => ['nullable', 'string', 'max:2000'],
            ],
            'suspend' => [
                'reason' => ['nullable', 'string', 'max:2000'],
            ],
            'bulkApprove' => [
                'policy_ids' => ['required', 'array'],
                'policy_ids.*' => ['exists:policies,id'],
                'notes' => ['nullable', 'string', 'max:1000'],
            ],
            'bulkIssue' => [
                'policy_ids' => ['required', 'array'],
                'policy_ids.*' => ['exists:policies,id'],
            ],
            'convertQuote' => [
                'quote_id' => ['required', 'integer', 'exists:quotes,id'],
                'effective_date' => ['required', 'date', 'after_or_equal:today'],
                'expiry_date' => ['required', 'date', 'after:effective_date'],
                'payment_frequency' => ['required', 'string', 'in:monthly,quarterly,semi_annual,annual'],
            ],
            default => [],
        };
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'A reason is required for rejection.',
            'reason.max' => 'Reason must not exceed 2000 characters.',
            'notes.max' => 'Notes must not exceed 2000 characters.',
            'policy_ids.required' => 'Please select at least one policy.',
            'policy_ids.array' => 'Invalid selection format.',
            'policy_ids.*.exists' => 'One or more selected policies are invalid.',
            'quote_id.required' => 'Quote ID is required.',
            'quote_id.exists' => 'Selected quote is invalid.',
        ];
    }
}
