<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CertificateActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'policy_ids' => 'required|array',
            'policy_ids.*' => 'exists:policies,id',
            'template_ids' => 'required|array',
            'template_ids.*' => 'exists:document_templates,id',
            'options' => 'sometimes|array',
        ];
    }
}
