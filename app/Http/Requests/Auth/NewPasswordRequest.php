<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules;

class NewPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token' => 'required',
            'email' => 'required|email',
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
