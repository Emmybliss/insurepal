<?php

namespace App\Http\Resources\Api\V1;

use App\Models\InsuranceCompanyBranch;
use Illuminate\Http\Request;

class InsuranceCompanyBranchResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        /** @var InsuranceCompanyBranch $this */
        return [
            'id' => $this->id,
            'insurance_company_id' => $this->insurance_company_id,
            'name' => $this->name,
            'code' => $this->code,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'email' => $this->email,
            'phone' => $this->phone,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
