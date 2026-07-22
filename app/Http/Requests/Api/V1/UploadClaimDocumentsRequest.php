<?php

namespace App\Http\Requests\Api\V1;

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
            'documents' => 'required|array|min:1',
            'documents.*.file' => 'required|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240',
            'documents.*.document_type' => 'nullable|string|max:50',
            'documents.*.description' => 'nullable|string|max:1000',
        ];
    }
}
