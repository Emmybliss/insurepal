<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RejectPolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'policy_id' => 'required|exists:policies,id',
            'reason' => 'required|string|max:1000',
        ];
    }
}
