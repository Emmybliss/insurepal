<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
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
                Rule::unique('roles')->ignore($this->route('role')->id),
            ],
            'description' => 'nullable|string|max:1000',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ];
    }
}
