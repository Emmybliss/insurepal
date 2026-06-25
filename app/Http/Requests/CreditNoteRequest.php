<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreditNoteRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'customer_id' => 'required|exists:customers,id',
            'policy_id' => 'nullable|exists:policies,id',
            'description' => 'required|string|max:1000',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'metadata' => 'nullable|array',
            'items' => 'nullable|array',
            'total_amount' => 'required|numeric|min:0',
            'currency_code' => 'required|string|max:3',
            'exchange_rate' => 'required|numeric|min:0',
            'issue_date' => 'required|date',
        ];
    }
}
