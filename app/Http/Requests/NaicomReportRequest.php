<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class NaicomReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reporting_year' => 'required|integer|min:2020|max:2099',
            'reporting_half' => 'required|in:H1,H2',
            'commission_recognition_date' => 'nullable|date',
        ];
    }
}
