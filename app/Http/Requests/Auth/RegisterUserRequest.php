<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules;

class RegisterUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'cf-turnstile-response' => ['required', 'string', new \App\Rules\Turnstile],
        ];
    }

    public function messages(): array
    {
        return [
            'cf-turnstile-response.required' => 'Please complete the security check to verify you are human.',
        ];
    }
}
