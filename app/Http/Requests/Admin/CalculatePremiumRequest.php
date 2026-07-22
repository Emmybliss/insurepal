<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CalculatePremiumRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'policy_product_id' => 'required|exists:policy_products,id',
            'sum_assured' => 'required|numeric|min:0',
            'factors' => 'nullable|array',
        ];
    }
}
