<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Policy;
use Illuminate\Http\Request;

class PolicyResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        /** @var Policy $this */
        return [
            'id' => $this->id,
            'policy_number' => $this->policy_number,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'approval_status' => $this->approval_status,
            'approval_status_label' => $this->approval_status_label,
            'source_type' => $this->source_type,
            'source_type_label' => $this->source_type_label,
            'effective_date' => $this->effective_date?->toDateString(),
            'expiry_date' => $this->expiry_date?->toDateString(),
            'placement_date' => $this->placement_date?->toDateString(),
            'coverage_details' => $this->coverage_details,
            'premium_amount' => $this->premium_amount,
            'commission_amount' => $this->commission_amount,
            'total_amount' => $this->total_amount,
            'sum_insured' => $this->sum_insured,
            'net_premium' => $this->net_premium,
            'payment_frequency' => $this->payment_frequency,
            'form_data' => $this->form_data,
            'terms_conditions' => $this->terms_conditions,
            'notes' => $this->notes,
            'internal_notes' => $this->internal_notes,
            'is_policy_issued' => $this->is_policy_issued,
            'auto_renewal_notification' => $this->auto_renewal_notification,
            'days_until_expiry' => $this->days_until_expiry,
            'policy_display_name' => $this->policy_display_name,
            'insurer_name' => $this->insurer_name,
            'insurer_email' => $this->insurer_email,
            'insurer_phone' => $this->insurer_phone,
            'insurer_source' => $this->insurer_source,
            'broker_slip_number' => $this->broker_slip_number,
            'approved_at' => $this->approved_at?->toISOString(),
            'issued_at' => $this->issued_at?->toISOString(),
            'renewed_at' => $this->renewed_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'is_active' => $this->isActive(),
            'is_expired' => $this->isExpired(),
            'is_draft' => $this->isDraft(),
            'can_be_issued' => $this->canBeIssued(),
            'can_be_cancelled' => $this->canBeCancelled(),
            'can_be_amended' => $this->canBeAmended(),
            'can_be_renewed' => $this->canBeRenewed(),
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'policy_product' => $this->whenLoaded('policyProduct', function () {
                return [
                    'id' => $this->policyProduct->id,
                    'name' => $this->policyProduct->name,
                    'type' => $this->policyProduct->type,
                ];
            }),
            'policy_type' => $this->whenLoaded('policyType', function () {
                return [
                    'id' => $this->policyType->id,
                    'name' => $this->policyType->name,
                ];
            }),
            'policy_class' => $this->whenLoaded('policyClass', function () {
                return [
                    'id' => $this->policyClass->id,
                    'name' => $this->policyClass->name,
                ];
            }),
            'created_by' => $this->whenLoaded('createdBy', function () {
                return [
                    'id' => $this->createdBy->id,
                    'name' => $this->createdBy->name,
                ];
            }),
            'approved_by' => $this->whenLoaded('approvedBy', function () {
                return [
                    'id' => $this->approvedBy->id,
                    'name' => $this->approvedBy->name,
                ];
            }),
            'issued_by' => $this->whenLoaded('issuedBy', function () {
                return [
                    'id' => $this->issuedBy->id,
                    'name' => $this->issuedBy->name,
                ];
            }),
            'quote' => $this->whenLoaded('quote', function () {
                return [
                    'id' => $this->quote->id,
                    'quote_number' => $this->quote->quote_number,
                ];
            }),
            'insurer' => $this->whenLoaded('insurer', function () {
                return [
                    'id' => $this->insurer->id,
                    'name' => $this->insurer->name,
                ];
            }),
            'risks' => $this->whenLoaded('risks', function () {
                return $this->risks->map(function ($risk) {
                    return [
                        'id' => $risk->id,
                        'description' => $risk->description,
                        'coverage_amount' => $risk->coverage_amount,
                        'rate' => $risk->rate,
                        'rate_basis' => $risk->rate_basis,
                        'premium' => $risk->premium,
                        'dynamic_fields' => $risk->dynamic_fields,
                        'sort_order' => $risk->sort_order,
                    ];
                });
            }),
        ];
    }
}
