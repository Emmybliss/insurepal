<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'label_overrides' => 'nullable|json',
            'color_overrides' => 'nullable|json',
            'font_overrides' => 'nullable|json',
            'css_overrides' => 'nullable|json',
            'custom_content' => 'nullable|string',
            'header_image' => 'nullable|image|max:20480',
            'footer_image' => 'nullable|image|max:20480',
            'signature' => 'nullable|image|max:10240',
            'stamp' => 'nullable|image|max:10240',
            'element_toggles' => 'nullable|json',
        ];
    }
}
