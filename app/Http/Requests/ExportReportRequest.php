<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExportReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'report_type' => 'required|string',
            'format' => 'required|in:pdf,excel',
            'period' => 'required|string',
        ];
    }
}
