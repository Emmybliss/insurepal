<?php

namespace App\Http\Requests;

use App\Models\Customer;
use App\Models\InsuranceProduct;
use App\Models\Quote;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class QuoteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Auth::check() && Auth::user()->tenant_id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $tenantId = Auth::user()->tenant_id;
        $quoteId = $this->route('quote') ? $this->route('quote')->id : null;

        return [
            'customer_id' => [
                'required',
                'integer',
                Rule::exists('customers', 'id')->where('tenant_id', $tenantId),
            ],
            'insurance_product_id' => [
                'required',
                'integer',
                Rule::exists('insurance_products', 'id')->where('is_active', true),
            ],
            'status' => [
                'sometimes',
                'string',
                Rule::in(array_keys(Quote::getStatuses())),
            ],
            'coverage_details' => [
                'required',
                'array',
                'min:1',
            ],
            'coverage_details.*.type' => [
                'required',
                'string',
                'max:255',
            ],
            'coverage_details.*.amount' => [
                'required',
                'numeric',
                'min:0',
            ],
            'coverage_details.*.description' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'premium_amount' => [
                'sometimes',
                'numeric',
                'min:0',
                'max:999999999.99',
            ],
            'commission_amount' => [
                'sometimes',
                'numeric',
                'min:0',
                'max:999999999.99',
            ],
            'total_amount' => [
                'sometimes',
                'numeric',
                'min:0',
                'max:999999999.99',
            ],
            'valid_until' => [
                'required',
                'date',
                'after:today',
                'before:'.now()->addYear()->toDateString(),
            ],
            'form_data' => [
                'nullable',
                'array',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:2000',
            ],
            'internal_notes' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'customer_id.required' => 'Please select a customer.',
            'customer_id.exists' => 'The selected customer is invalid or does not belong to your organization.',
            'insurance_product_id.required' => 'Please select an insurance product.',
            'insurance_product_id.exists' => 'The selected insurance product is invalid or inactive.',
            'coverage_details.required' => 'Coverage details are required.',
            'coverage_details.min' => 'At least one coverage detail must be provided.',
            'coverage_details.*.type.required' => 'Coverage type is required for each coverage detail.',
            'coverage_details.*.amount.required' => 'Coverage amount is required for each coverage detail.',
            'coverage_details.*.amount.min' => 'Coverage amount must be greater than or equal to 0.',
            'valid_until.required' => 'Quote validity date is required.',
            'valid_until.after' => 'Quote validity date must be in the future.',
            'valid_until.before' => 'Quote validity date cannot be more than one year from now.',
            'premium_amount.min' => 'Premium amount must be greater than or equal to 0.',
            'commission_amount.min' => 'Commission amount must be greater than or equal to 0.',
            'total_amount.min' => 'Total amount must be greater than or equal to 0.',
            'notes.max' => 'Notes cannot exceed 2000 characters.',
            'internal_notes.max' => 'Internal notes cannot exceed 2000 characters.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Validate that customer belongs to the same tenant
            if ($this->filled('customer_id')) {
                $customer = Customer::find($this->customer_id);
                if ($customer && $customer->tenant_id !== Auth::user()->tenant_id) {
                    $validator->errors()->add('customer_id', 'The selected customer does not belong to your organization.');
                }
            }

            // Validate insurance product is active
            if ($this->filled('insurance_product_id')) {
                $product = InsuranceProduct::find($this->insurance_product_id);
                if ($product && ! $product->is_active) {
                    $validator->errors()->add('insurance_product_id', 'The selected insurance product is currently inactive.');
                }
            }

            // Validate coverage details structure
            if ($this->filled('coverage_details')) {
                $coverageDetails = $this->coverage_details;
                $totalCoverage = 0;

                foreach ($coverageDetails as $index => $detail) {
                    if (isset($detail['amount']) && is_numeric($detail['amount'])) {
                        $totalCoverage += (float) $detail['amount'];
                    }

                    // Validate specific coverage types based on insurance product
                    if ($this->filled('insurance_product_id')) {
                        $product = InsuranceProduct::find($this->insurance_product_id);
                        if ($product && $product->form_fields) {
                            // Additional product-specific validation can be added here
                        }
                    }
                }

                // Ensure total coverage amount is reasonable
                if ($totalCoverage > 1000000000) { // 1 billion limit
                    $validator->errors()->add('coverage_details', 'Total coverage amount exceeds maximum allowed limit.');
                }
            }

            // Validate amounts relationship (if provided)
            if ($this->filled(['premium_amount', 'commission_amount', 'total_amount'])) {
                $premium = (float) $this->premium_amount;
                $commission = (float) $this->commission_amount;
                $total = (float) $this->total_amount;

                if (abs(($premium + $commission) - $total) > 0.01) { // Allow for small floating point differences
                    $validator->errors()->add('total_amount', 'Total amount must equal premium amount plus commission amount.');
                }
            }

            // Validate form_data against insurance product requirements
            if ($this->filled(['insurance_product_id', 'form_data'])) {
                $product = InsuranceProduct::find($this->insurance_product_id);
                if ($product && $product->form_fields) {
                    $this->validateFormData($validator, $product->form_fields, $this->form_data);
                }
            }
        });
    }

    /**
     * Validate form data against product form fields requirements.
     */
    private function validateFormData($validator, array $formFields, array $formData): void
    {
        foreach ($formFields as $field) {
            $fieldName = $field['name'] ?? null;
            $required = $field['required'] ?? false;
            $type = $field['type'] ?? 'text';

            if (! $fieldName) {
                continue;
            }

            // Check if required field is missing
            if ($required && (! isset($formData[$fieldName]) || $formData[$fieldName] === '')) {
                $validator->errors()->add("form_data.{$fieldName}", "The {$fieldName} field is required.");

                continue;
            }

            // Skip validation if field is empty and not required
            if (! isset($formData[$fieldName]) || $formData[$fieldName] === '') {
                continue;
            }

            $value = $formData[$fieldName];

            // Type-specific validation
            switch ($type) {
                case 'number':
                    if (! is_numeric($value)) {
                        $validator->errors()->add("form_data.{$fieldName}", "The {$fieldName} must be a number.");
                    }
                    break;

                case 'email':
                    if (! filter_var($value, FILTER_VALIDATE_EMAIL)) {
                        $validator->errors()->add("form_data.{$fieldName}", "The {$fieldName} must be a valid email address.");
                    }
                    break;

                case 'date':
                    if (! strtotime($value)) {
                        $validator->errors()->add("form_data.{$fieldName}", "The {$fieldName} must be a valid date.");
                    }
                    break;

                case 'select':
                    $options = $field['options'] ?? [];
                    $validValues = array_column($options, 'value');
                    if (! in_array($value, $validValues)) {
                        $validator->errors()->add("form_data.{$fieldName}", "The selected {$fieldName} is invalid.");
                    }
                    break;
            }

            // Length validation
            if (isset($field['max_length']) && strlen($value) > $field['max_length']) {
                $validator->errors()->add("form_data.{$fieldName}", "The {$fieldName} may not be greater than {$field['max_length']} characters.");
            }

            if (isset($field['min_length']) && strlen($value) < $field['min_length']) {
                $validator->errors()->add("form_data.{$fieldName}", "The {$fieldName} must be at least {$field['min_length']} characters.");
            }

            // Numeric range validation
            if ($type === 'number' && is_numeric($value)) {
                if (isset($field['min_value']) && $value < $field['min_value']) {
                    $validator->errors()->add("form_data.{$fieldName}", "The {$fieldName} must be at least {$field['min_value']}.");
                }

                if (isset($field['max_value']) && $value > $field['max_value']) {
                    $validator->errors()->add("form_data.{$fieldName}", "The {$fieldName} may not be greater than {$field['max_value']}.");
                }
            }
        }
    }

    /**
     * Get validated data with proper casting and defaults.
     */
    public function validatedData(): array
    {
        $validated = $this->validated();

        // Add tenant_id to the validated data
        $validated['tenant_id'] = Auth::user()->tenant_id;

        // Set default status if not provided
        if (! isset($validated['status'])) {
            $validated['status'] = Quote::STATUS_DRAFT;
        }

        // Ensure coverage_details is properly structured
        if (isset($validated['coverage_details'])) {
            $validated['coverage_details'] = array_values($validated['coverage_details']);
        }

        return $validated;
    }
}
