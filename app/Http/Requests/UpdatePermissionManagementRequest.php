<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePermissionManagementRequest extends FormRequest
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
                Rule::unique('permissions')->where('tenant_id', $this->user()->tenant->id)->ignore($this->route('permission')->id),
            ],
            'display_name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'category' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ];
    }
}
