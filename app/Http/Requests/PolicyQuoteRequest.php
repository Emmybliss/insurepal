<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PolicyQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'policy_id' => 'required|exists:policy_products,id',
            'sum_assured' => 'required|numeric|min:0',
            'factors' => 'nullable|array',
        ];
    }
}
