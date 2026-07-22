<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateApiKeyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'paystack_public_key' => 'nullable|string|max:255',
            'paystack_secret_key' => 'nullable|string|max:255',
            'paystack_webhook_secret' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [];
    }
}
