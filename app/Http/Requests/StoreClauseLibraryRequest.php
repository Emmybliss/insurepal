<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClauseLibraryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'clause_type' => ['required', 'string', 'in:coverage,warranty,exclusion,subjectivity,condition,special'],
            'title' => ['required', 'string', 'max:200'],
            'content' => ['required', 'string'],
            'policy_class_id' => ['nullable', 'exists:policy_classes,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
