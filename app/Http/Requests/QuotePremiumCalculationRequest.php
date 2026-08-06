<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class QuotePremiumCalculationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sum_insured' => ['required', 'numeric', 'min:0'],
            'rate' => ['nullable', 'numeric', 'min:0'],
            'rate_basis' => ['nullable', 'string', 'in:percentage,per_mille,fixed'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'fees' => ['nullable', 'numeric', 'min:0'],
            'taxes' => ['nullable', 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
