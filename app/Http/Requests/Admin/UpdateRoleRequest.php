<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $roleId = $this->route('role')?->id;

        return [
            'name' => 'required|string|max:255|unique:roles,name,'.$roleId,
            'description' => 'nullable|string',
            'guard_name' => 'string|max:255',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ];
    }
}
