<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkCreatePermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'permissions' => 'required|array|min:1',
            'permissions.*.name' => 'required|string|max:255|unique:permissions,name',
            'permissions.*.description' => 'nullable|string|max:1000',
            'permissions.*.category' => 'nullable|string|max:100',
        ];
    }
}
