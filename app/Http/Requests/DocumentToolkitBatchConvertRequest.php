<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DocumentToolkitBatchConvertRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'images' => 'required|array|min:1',
            'images.*' => 'required|image|max:20480',
            'title' => 'nullable|string|max:255',
        ];
    }
}
