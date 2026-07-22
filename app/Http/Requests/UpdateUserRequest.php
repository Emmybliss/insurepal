<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$this->route('user')->id,
            'password' => ['nullable', Rules\Password::defaults()],
            'password_confirmation' => 'nullable|same:password',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
            'is_active' => 'boolean',
        ];
    }
}
