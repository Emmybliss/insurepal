<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class AssignThreadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'assignee_id' => 'required|integer|exists:users,id',
        ];
    }

    public function messages(): array
    {
        return [
            'assignee_id.required' => 'Assignee is required.',
            'assignee_id.exists' => 'Selected user does not exist.',
        ];
    }
}
