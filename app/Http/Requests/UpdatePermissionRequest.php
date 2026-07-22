<?php

namespace App\Http\Requests;

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
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('permissions')->ignore($this->route('permission')->id),
            ],
            'description' => 'nullable|string|max:1000',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
        ];
    }
}
