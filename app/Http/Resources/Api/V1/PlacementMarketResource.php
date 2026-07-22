<?php

namespace App\Http\Resources\Api\V1;

use App\Enums\PlacementMarketStatus;
use App\Models\PlacementMarket;
use Illuminate\Http\Request;

class PlacementMarketResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        /** @var PlacementMarket $this */
        return [
            'id' => $this->id,
            'placement_id' => $this->placement_id,
            'insurance_company_id' => $this->insurance_company_id,
            'insurer_branch' => $this->insurer_branch,
            'contact_person' => $this->contact_person,
            'contact_email' => $this->contact_email,
            'is_lead' => $this->is_lead,
            'participation_percentage' => $this->participation_percentage,
            'offered_rate' => $this->offered_rate,
            'rate_basis' => $this->rate_basis,
            'gross_premium' => $this->gross_premium,
            'commission_rate' => $this->commission_rate,
            'commission_amount' => $this->commission_amount,
            'co_broker_commission' => $this->co_broker_commission,
            'reporting_broker_commission' => $this->reporting_broker_commission,
            'fees' => $this->fees,
            'taxes' => $this->taxes,
            'net_premium' => $this->net_premium,
            'status' => $this->status,
            'status_label' => PlacementMarketStatus::tryFrom($this->status)?->label(),
            'status_color' => PlacementMarketStatus::tryFrom($this->status)?->color(),
            'response_date' => $this->response_date?->toISOString(),
            'response_notes' => $this->response_notes,
            'insurer_reference' => $this->insurer_reference,
            'sent_at' => $this->sent_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'insurance_company' => $this->whenLoaded('insuranceCompany', function () {
                return [
                    'id' => $this->insuranceCompany->id,
                    'name' => $this->insuranceCompany->name,
                ];
            }),
        ];
    }
}
