<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBrokerKycRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => 'required|in:pending,verified,rejected',
            'notes' => 'nullable|string|max:2000',
            'rc_number' => 'nullable|string|max:50',
            'naicom_reg_number' => 'nullable|string|max:50',
            'tin' => 'nullable|string|max:50',
            'incorporation_cert' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'naicom_license' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'prof_indemnity' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ];
    }
}
