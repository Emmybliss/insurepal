<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invoice_id' => ['nullable', 'exists:invoices,id'],
            'customer_id' => ['required', 'exists:customers,id'],
            'policy_id' => ['nullable', 'exists:policies,id'],
            'policy_number' => ['nullable', 'string', 'max:255'],
            'amount_paid' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'string'],
            'payment_date' => ['required', 'date'],
            'transaction_id' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'currency' => ['required', 'string', 'size:3'],
        ];
    }
}
