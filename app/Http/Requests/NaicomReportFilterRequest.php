<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class NaicomReportFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'form_type' => 'required|string|in:7.2A,7.2B,7.2C',
            'report_line_id' => 'nullable|exists:naicom_report_lines,id',
            'field' => 'nullable|string|max:100',
            'calculated_value' => 'nullable|numeric',
            'adjusted_value' => 'required|numeric',
            'reason' => 'required|string|min:10',
            'supporting_document' => 'nullable|string|max:255',
        ];
    }
}
