<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TenantRelationshipRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'requested_id' => 'required|exists:tenants,id|different:'.auth()->user()->tenant_id,
            'request_message' => 'nullable|string|max:1000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'requested_id.required' => 'Please select a tenant to connect with.',
            'requested_id.exists' => 'The selected tenant does not exist.',
            'requested_id.different' => 'You cannot send a relationship request to yourself.',
            'request_message.max' => 'The request message cannot exceed 1000 characters.',
        ];
    }
}
