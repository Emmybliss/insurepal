<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RenewalActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'new_expiry_date' => 'required|date|after:today',
            'new_premium' => 'required|numeric|min:0',
            'renewal_notes' => 'nullable|string',
        ];
    }
}
