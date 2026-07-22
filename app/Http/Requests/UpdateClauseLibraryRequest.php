<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClauseLibraryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:200'],
            'content' => ['sometimes', 'string'],
            'clause_type' => ['sometimes', 'string', 'in:coverage,warranty,exclusion,subjectivity,condition,special'],
            'policy_class_id' => ['nullable', 'exists:policy_classes,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
