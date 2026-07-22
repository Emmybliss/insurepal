<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DocumentOverlayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => 'required|string',
            'page_number' => 'nullable|integer',
            'position_x' => 'required|numeric',
            'position_y' => 'required|numeric',
            'width' => 'required|numeric',
            'height' => 'required|numeric',
            'rotation' => 'nullable|numeric',
            'content' => 'nullable|string',
            'settings' => 'nullable|array',
        ];
    }
}
