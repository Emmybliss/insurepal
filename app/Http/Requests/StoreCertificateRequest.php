<?php

namespace App\Http\Requests;

use App\Models\PolicyCertificate;
use Illuminate\Foundation\Http\FormRequest;

class StoreCertificateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'template_key' => 'required|string',
            'type' => 'sometimes|string|in:'.implode(',', array_keys(PolicyCertificate::getAvailableTypes())),
            'options' => 'sometimes|array',
            'certificate_pdf' => 'required|file|mimes:pdf|max:10240',
        ];
    }
}
