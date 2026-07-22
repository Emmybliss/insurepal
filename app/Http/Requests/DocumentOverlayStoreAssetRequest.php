<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DocumentOverlayStoreAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => 'required|image|max:10240',
            'type' => 'required|string|in:signature,stamp,letterhead,footer',
            'name' => 'required|string|max:255',
        ];
    }
}
