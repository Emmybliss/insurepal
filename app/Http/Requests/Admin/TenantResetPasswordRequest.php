<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class TenantResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'password' => 'required|string|min:8|confirmed',
            'user_id' => 'nullable|integer|exists:users,id',
        ];
    }
}
