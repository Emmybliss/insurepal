<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Invoice;
use Illuminate\Http\Request;

class InvoiceResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        /** @var Invoice $this */
        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'status' => $this->status,
            'currency' => $this->currency,
            'subtotal' => (float) $this->subtotal,
            'tax_amount' => (float) $this->tax_amount,
            'discount_amount' => (float) $this->discount_amount,
            'total_amount' => (float) $this->total_amount,
            'due_date' => $this->due_date?->toDateString(),
            'notes' => $this->notes,
            'billing_address' => $this->billing_address,
            'shipping_address' => $this->shipping_address,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'customer' => $this->whenLoaded('customer', function () {
                return [
                    'id' => $this->customer->id,
                    'name' => $this->customer->first_name.' '.$this->customer->last_name,
                    'company_name' => $this->customer->company_name,
                ];
            }),
            'policy' => $this->whenLoaded('policy', function () {
                return [
                    'id' => $this->policy->id,
                    'policy_number' => $this->policy->policy_number,
                ];
            }),
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                ];
            }),
            'items' => $this->whenRelationLoaded('items', InvoiceItemResource::collection($this->items)),
        ];
    }
}
