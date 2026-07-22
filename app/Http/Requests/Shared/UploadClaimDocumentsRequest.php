<?php

namespace App\Http\Requests\Shared;

use Illuminate\Foundation\Http\FormRequest;

class UploadClaimDocumentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'documents' => ['required', 'array'],
            'documents.*' => ['file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:10240'],
            'document_types' => ['nullable', 'array'],
            'descriptions' => ['nullable', 'array'],
        ];
    }
}
