<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubscriptionPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'price' => 'required|numeric|min:0',
            'setup_fee' => 'nullable|numeric|min:0',
            'currency' => 'required|string|size:3',
            'max_users' => 'nullable|integer|min:1',
            'max_storage_gb' => 'nullable|integer|min:1',
            'features' => 'nullable|array',
            'features.*' => 'string|max:200',
            'is_active' => 'boolean',
            'is_popular' => 'boolean',
            'sort_order' => 'integer|min:0',
        ];
    }
}
