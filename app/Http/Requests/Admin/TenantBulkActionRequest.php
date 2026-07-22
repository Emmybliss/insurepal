<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class TenantBulkActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'action' => 'required|in:activate,deactivate,extend_trial',
            'tenant_ids' => 'required|array|min:1',
            'tenant_ids.*' => 'exists:tenants,id',
            'days' => 'required_if:action,extend_trial|integer|min:1|max:365',
        ];
    }
}
