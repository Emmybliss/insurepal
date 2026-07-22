<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class PasswordResetLinkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required|email',
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
