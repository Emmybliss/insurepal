<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string',
            'guard_name' => 'string|max:255',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ];
    }
}
