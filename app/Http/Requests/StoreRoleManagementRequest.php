<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoleManagementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('roles')->where('tenant_id', $this->user()->tenant->id),
            ],
            'display_name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
            'is_active' => 'boolean',
        ];
    }
}
