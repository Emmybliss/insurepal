<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'tenant_id' => 'nullable|exists:tenants,id',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
            'is_active' => 'boolean',
            'send_welcome_email' => 'boolean',
        ];
    }
}
