<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class StoreApiKeyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'scopes' => 'nullable|array',
            'allowed_domains' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [];
    }
}
