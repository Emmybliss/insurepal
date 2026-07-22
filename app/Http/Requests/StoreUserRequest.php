<?php

namespace App\Http\Requests;

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
            'password' => ['required', Rules\Password::defaults()],
            'password_confirmation' => 'required|same:password',
            'roles' => 'array',
            'roles.*' => 'exists:roles,id',
            'is_active' => 'boolean',
            'send_invitation' => 'boolean',
        ];
    }
}
