<?php

namespace App\Http\Requests;

use App\Models\BrokerSlip;
use Illuminate\Foundation\Http\FormRequest;

class StoreDirectBrokerSlipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation()
    {
        $risks = $this->input('risks');
        if (empty($this->policy_product_id) && ! empty($risks) && is_array($risks)) {
            $firstRisk = reset($risks);
            if (! empty($firstRisk['policy_product_id'])) {
                $this->merge([
                    'policy_product_id' => $firstRisk['policy_product_id'],
                ]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'exists:customers,id'],
            'insured_id' => ['nullable', 'exists:customers,id'],
            'policy_class_id' => ['nullable', 'exists:policy_classes,id'],
            'policy_product_id' => ['required', 'exists:policy_products,id'],
            'insurance_company_id' => [
                'required',
                'exists:insurance_companies,id',
                function (string $attribute, mixed $value, \Closure $fail) {
                    $customerId = $this->input('customer_id');
                    $policyProductId = $this->input('policy_product_id');

                    $duplicate = BrokerSlip::whereHas('placement', function ($q) use ($customerId, $policyProductId) {
                        $q->where('customer_id', $customerId)
                            ->where('policy_product_id', $policyProductId);
                    })
                        ->whereHas('placementMarket', function ($q) use ($value) {
                            $q->where('insurance_company_id', $value);
                        })
                        ->whereNotIn('status', ['superseded', 'withdrawn'])
                        ->exists();

                    if ($duplicate) {
                        $fail('A broker slip already exists for this insurer. Create a revision instead.');
                    }
                },
            ],
            'currency' => ['nullable', 'string', 'size:3'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after:period_start'],
            'claim_payment_condition' => ['nullable', 'string'],
            'risk_details' => ['nullable', 'string'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'fees' => ['nullable', 'numeric', 'min:0'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'risks' => ['nullable', 'array'],
            'risks.*.policy_class_id' => ['nullable', 'exists:policy_classes,id'],
            'risks.*.policy_product_id' => ['nullable', 'exists:policy_products,id'],
            'risks.*.description' => ['nullable', 'string'],
            'risks.*.coverage_amount' => ['required_with:risks', 'numeric', 'min:0'],
            'risks.*.premium' => ['nullable', 'numeric', 'min:0'],
            'risks.*.rate' => ['nullable', 'numeric', 'min:0'],
            'risks.*.rate_basis' => ['nullable', 'string', 'max:20'],
            'risks.*.dynamic_fields' => ['nullable', 'array'],
            'risks.*.inception_date' => ['nullable', 'date'],
            'risks.*.expiry_date' => ['nullable', 'date', 'after_or_equal:risks.*.inception_date'],
            'items' => ['nullable', 'array'],
            'clauses' => ['nullable', 'array'],
            'clauses.*.clause_type' => ['required_with:clauses', 'string'],
            'clauses.*.title' => ['required_with:clauses', 'string', 'max:200'],
            'clauses.*.content' => ['required_with:clauses', 'string'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
