<?php

namespace App\Http\Resources\Api\V1;

use App\Enums\PlacementStatus;
use App\Models\Placement;
use Illuminate\Http\Request;

class PlacementResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        /** @var Placement $this */
        return [
            'id' => $this->id,
            'placement_number' => $this->placement_number,
            'status' => $this->status,
            'status_label' => $this->status instanceof PlacementStatus ? $this->status->label() : PlacementStatus::tryFrom($this->status)?->label(),
            'status_color' => $this->status instanceof PlacementStatus ? $this->status->color() : PlacementStatus::tryFrom($this->status)?->color(),
            'currency' => $this->currency,
            'proposed_start_date' => $this->proposed_start_date?->toDateString(),
            'proposed_end_date' => $this->proposed_end_date?->toDateString(),
            'total_sum_insured' => $this->total_sum_insured,
            'notes' => $this->notes,
            'risk_details' => $this->risk_details,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'customer' => $this->whenLoaded('customer', function () {
                return [
                    'id' => $this->customer->id,
                    'name' => $this->customer->first_name.' '.$this->customer->last_name,
                    'company_name' => $this->customer->company_name,
                ];
            }),
            'insured' => $this->whenLoaded('insured', function () {
                return [
                    'id' => $this->insured->id,
                    'name' => $this->insured->first_name.' '.$this->insured->last_name,
                ];
            }),
            'policy_product' => $this->whenLoaded('policyProduct', function () {
                return [
                    'id' => $this->policyProduct->id,
                    'name' => $this->policyProduct->name,
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
            'markets' => $this->whenRelationLoaded('markets', PlacementMarketResource::collection($this->markets)),
            'broker_slips' => $this->whenRelationLoaded('brokerSlips', function () {
                return $this->brokerSlips->map(fn ($bs) => [
                    'id' => $bs->id,
                    'slip_number' => $bs->slip_number,
                    'version' => $bs->version,
                    'status' => $bs->status,
                ]);
            }),
        ];
    }
}
