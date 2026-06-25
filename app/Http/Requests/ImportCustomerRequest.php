<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Please select an Excel file to import.',
            'file.mimes' => 'Only .xlsx and .xls files are allowed.',
            'file.max' => 'File size must not exceed 5MB.',
        ];
    }
}
