<?php

namespace App\Http\Requests;

use App\Models\BrokerSlip;
use Illuminate\Foundation\Http\FormRequest;

class StoreBrokerSlipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'placement_id' => ['required', 'exists:placements,id'],
            'placement_market_id' => [
                'nullable',
                'exists:placement_markets,id',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if ($value && BrokerSlip::where('placement_market_id', $value)
                        ->whereNotIn('status', ['superseded', 'withdrawn'])
                        ->exists()
                    ) {
                        $fail('A broker slip already exists for this insurer. Create a revision instead.');
                    }
                },
            ],
            'currency' => ['nullable', 'string', 'size:3'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after:period_start'],
            'claim_payment_condition' => ['nullable', 'string'],
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
        ];
    }
}
