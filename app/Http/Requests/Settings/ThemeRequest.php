<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class ThemeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'primary_color' => 'required|string|regex:/^#[a-fA-F0-9]{6}$/',
            'secondary_color' => 'required|string|regex:/^#[a-fA-F0-9]{6}$/',
            'accent_color' => 'required|string|regex:/^#[a-fA-F0-9]{6}$/',
            'gradient.from' => 'required|string|regex:/^#[a-fA-F0-9]{6}$/',
            'gradient.via' => 'required|string|regex:/^#[a-fA-F0-9]{6}$/',
            'gradient.to' => 'required|string|regex:/^#[a-fA-F0-9]{6}$/',
            'sidebar_style' => 'required|in:solid,gradient,transparent',
            'header_style' => 'required|in:solid,gradient',
            'body_style' => 'required|in:solid,gradient,none',
        ];
    }

    public function messages(): array
    {
        return [];
    }
}
