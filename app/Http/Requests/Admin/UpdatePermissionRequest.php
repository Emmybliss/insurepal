<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $permissionId = $this->route('permission')?->id;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('permissions')->ignore($permissionId),
            ],
            'label' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'module' => 'required|string|max:100',
            'is_active' => 'boolean',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
        ];
    }
}
