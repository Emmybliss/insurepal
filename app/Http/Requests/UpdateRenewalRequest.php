<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRenewalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'expiry_date' => 'required|date|after:today',
            'premium_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ];
    }
}
