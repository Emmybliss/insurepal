<?php

namespace App\Http\Resources\Api\V1;

use App\Enums\BrokerSlipStatus;
use App\Models\BrokerSlip;
use Illuminate\Http\Request;

class BrokerSlipResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        /** @var BrokerSlip $this */
        return [
            'id' => $this->id,
            'slip_number' => $this->slip_number,
            'version' => $this->version,
            'status' => $this->status,
            'status_label' => BrokerSlipStatus::tryFrom($this->status)?->label(),
            'status_color' => BrokerSlipStatus::tryFrom($this->status)?->color(),
            'currency' => $this->currency,
            'sum_insured' => $this->sum_insured,
            'rate' => $this->rate,
            'rate_basis' => $this->rate_basis,
            'gross_premium' => $this->gross_premium,
            'commission_rate' => $this->commission_rate,
            'commission_amount' => $this->commission_amount,
            'co_broker_commission' => $this->co_broker_commission,
            'reporting_broker_commission' => $this->reporting_broker_commission,
            'fees' => $this->fees,
            'taxes' => $this->taxes,
            'discount' => $this->discount,
            'net_premium' => $this->net_premium,
            'period_start' => $this->period_start?->toDateString(),
            'period_end' => $this->period_end?->toDateString(),
            'claim_payment_condition' => $this->claim_payment_condition,
            'issued_at' => $this->issued_at?->toISOString(),
            'is_draft' => $this->isDraft(),
            'is_issued' => $this->isIssued(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'placement' => $this->whenLoaded('placement', function () {
                return [
                    'id' => $this->placement->id,
                    'placement_number' => $this->placement->placement_number,
                ];
            }),
            'placement_market' => $this->whenLoaded('placementMarket', function () {
                return [
                    'id' => $this->placementMarket->id,
                    'insurance_company_id' => $this->placementMarket->insurance_company_id,
                ];
            }),
            'created_by' => $this->whenLoaded('createdBy', function () {
                return [
                    'id' => $this->createdBy->id,
                    'name' => $this->createdBy->name,
                ];
            }),
            'issued_by' => $this->whenLoaded('issuedBy', function () {
                return [
                    'id' => $this->issuedBy->id,
                    'name' => $this->issuedBy->name,
                ];
            }),
            'approved_by' => $this->whenLoaded('approvedBy', function () {
                return [
                    'id' => $this->approvedBy->id,
                    'name' => $this->approvedBy->name,
                ];
            }),
            'items' => $this->whenRelationLoaded('risks', function () {
                return $this->risks->map(fn ($risk) => [
                    'id' => $risk->id,
                    'description' => $risk->description,
                    'identifier' => $risk->identifier,
                    'location' => $risk->location,
                    'quantity' => $risk->quantity,
                    'coverage_amount' => $risk->coverage_amount,
                    'rate' => $risk->rate,
                    'rate_basis' => $risk->rate_basis,
                    'premium' => $risk->premium,
                    'net_premium' => $risk->net_premium,
                    'commission_rate' => $risk->commission_rate,
                    'commission_amount' => $risk->commission_amount,
                    'taxes' => $risk->taxes,
                    'fees' => $risk->fees,
                    'dynamic_fields' => $risk->dynamic_fields,
                    'metadata' => $risk->metadata,
                    'policy_class_id' => $risk->policy_class_id,
                    'policy_product_id' => $risk->policy_product_id,
                    'inception_date' => $risk->inception_date?->toDateString(),
                    'expiry_date' => $risk->expiry_date?->toDateString(),
                    'sort_order' => $risk->sort_order,
                ]);
            }),
            'clauses' => $this->whenRelationLoaded('clauses', function () {
                return $this->clauses->map(fn ($clause) => [
                    'id' => $clause->id,
                    'clause_type' => $clause->clause_type,
                    'title' => $clause->title,
                    'content' => $clause->content,
                    'is_standard' => $clause->is_standard,
                    'sort_order' => $clause->sort_order,
                ]);
            }),
            'approvals' => $this->whenRelationLoaded('approvals', function () {
                return $this->approvals->map(fn ($a) => [
                    'id' => $a->id,
                    'status' => $a->status,
                    'request_notes' => $a->request_notes,
                    'approval_notes' => $a->approval_notes,
                    'rejection_reason' => $a->rejection_reason,
                    'changes_requested' => $a->changes_requested,
                    'requested_at' => $a->requested_at?->toISOString(),
                    'reviewed_at' => $a->reviewed_at?->toISOString(),
                    'approved_at' => $a->approved_at?->toISOString(),
                    'rejected_at' => $a->rejected_at?->toISOString(),
                    'requested_by' => $a->requestedBy ? ['id' => $a->requestedBy->id, 'name' => $a->requestedBy->name] : null,
                    'reviewed_by' => $a->reviewedBy ? ['id' => $a->reviewedBy->id, 'name' => $a->reviewedBy->name] : null,
                ]);
            }),
            'versions' => $this->whenRelationLoaded('versions', function () {
                return $this->versions->map(fn ($v) => [
                    'id' => $v->id,
                    'version' => $v->version,
                    'created_by' => $v->createdBy ? ['id' => $v->createdBy->id, 'name' => $v->createdBy->name] : null,
                    'created_at' => $v->created_at->toISOString(),
                ]);
            }),
            'email_logs' => $this->whenRelationLoaded('emailLogs', function () {
                return $this->emailLogs->map(fn ($log) => [
                    'id' => $log->id,
                    'recipient_email' => $log->recipient_email,
                    'recipient_name' => $log->recipient_name,
                    'subject' => $log->subject,
                    'delivery_status' => $log->delivery_status,
                    'sent_at' => $log->sent_at?->toISOString(),
                ]);
            }),
        ];
    }
}
