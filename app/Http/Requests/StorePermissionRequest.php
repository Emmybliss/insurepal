<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:permissions,name',
            'description' => 'nullable|string|max:1000',
            'category' => 'nullable|string|max:100',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
        ];
    }
}
