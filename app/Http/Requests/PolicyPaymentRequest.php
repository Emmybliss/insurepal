<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PolicyPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => 'required|numeric|min:1',
            'invoice_id' => 'nullable|exists:invoices,id',
        ];
    }
}
