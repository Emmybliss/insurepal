<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Customer;
use Illuminate\Http\Request;

/** @mixin Customer */
class CustomerResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'company_name' => $this->company_name,
            'display_name' => $this->display_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'country' => $this->country,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'gender' => $this->gender,
            'occupation' => $this->occupation,
            'annual_income' => $this->annual_income,
            'logo' => $this->logo,
            'is_active' => $this->is_active,
            'has_login_access' => $this->hasLoginAccess(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            $this->mergeWhen($this->includeRelation('user'), [
                'user' => $this->when($this->user, fn () => [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                ]),
            ]),

            $this->mergeWhen($this->includeRelation('kyc'), [
                'kyc' => $this->kyc,
            ]),

            $this->mergeWhen($this->includeRelation('policies'), [
                'policies_count' => $this->policies->count(),
            ]),

            $this->mergeWhen($this->includeRelation('quotes'), [
                'quotes_count' => $this->quotes->count(),
            ]),

            $this->mergeWhen($this->includeRelation('claims'), [
                'claims_count' => $this->claims->count(),
            ]),
        ];
    }
}
