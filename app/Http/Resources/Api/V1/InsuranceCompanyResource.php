<?php

namespace App\Http\Resources\Api\V1;

use App\Models\InsuranceCompany;
use Illuminate\Http\Request;

class InsuranceCompanyResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        /** @var InsuranceCompany $this */
        return [
            'id' => $this->id,
            'name' => $this->name,
            'company_type' => $this->company_type,
            'email' => $this->email,
            'phone' => $this->phone,
            'website' => $this->website,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'country' => $this->country,
            'naicom_reg_number' => $this->naicom_reg_number,
            'ncrib_reg_number' => $this->ncrib_reg_number,
            'rc_number' => $this->rc_number,
            'notes' => $this->notes,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'branches' => $this->whenRelationLoaded('branches', InsuranceCompanyBranchResource::collection($this->branches)),
            'contacts' => $this->whenRelationLoaded('contacts', InsuranceCompanyContactResource::collection($this->contacts)),
        ];
    }
}
