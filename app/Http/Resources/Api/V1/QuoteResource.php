<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Quote;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var Quote $this */
        return [
            'id' => $this->id,
            'quote_number' => $this->quote_number,
            'status' => $this->status,
            'status_color' => $this->status_color,
            'coverage_details' => $this->coverage_details,
            'premium_amount' => $this->premium_amount,
            'commission_amount' => $this->commission_amount,
            'total_amount' => $this->total_amount,
            'formatted_premium_amount' => $this->formatted_premium_amount,
            'formatted_total_amount' => $this->formatted_total_amount,
            'valid_until' => $this->valid_until?->toISOString(),
            'is_expired' => $this->is_expired,
            'form_data' => $this->form_data,
            'notes' => $this->notes,
            'internal_notes' => $this->internal_notes,
            'can_edit' => $this->canEdit(),
            'can_send' => $this->canSend(),
            'can_accept' => $this->canAccept(),
            'can_reject' => $this->canReject(),
            'can_convert_to_policy' => $this->canConvertToPolicy(),
            'customer_name' => $this->customer_name,
            'sent_at' => $this->sent_at?->toISOString(),
            'accepted_at' => $this->accepted_at?->toISOString(),
            'rejected_at' => $this->rejected_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'insurance_product' => $this->whenLoaded('insuranceProduct', function () {
                return [
                    'id' => $this->insuranceProduct->id,
                    'name' => $this->insuranceProduct->name,
                    'type' => $this->insuranceProduct->type,
                    'description' => $this->insuranceProduct->description,
                ];
            }),
            'created_by' => $this->whenLoaded('createdBy', function () {
                return [
                    'id' => $this->createdBy->id,
                    'name' => $this->createdBy->name,
                ];
            }),
            'policy' => $this->whenLoaded('policy', function () {
                return [
                    'id' => $this->policy->id,
                    'policy_number' => $this->policy->policy_number,
                    'status' => $this->policy->status,
                ];
            }),
        ];
    }
}
