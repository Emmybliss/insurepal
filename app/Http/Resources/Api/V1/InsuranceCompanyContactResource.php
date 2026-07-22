<?php

namespace App\Http\Resources\Api\V1;

use App\Models\InsuranceCompanyContact;
use Illuminate\Http\Request;

class InsuranceCompanyContactResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        /** @var InsuranceCompanyContact $this */
        return [
            'id' => $this->id,
            'insurance_company_id' => $this->insurance_company_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'position' => $this->position,
            'is_primary' => $this->is_primary,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
