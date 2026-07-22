<?php

namespace App\Http\Resources\Api\V1;

use App\Models\DebitNote;
use Illuminate\Http\Request;

class DebitNoteResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        /** @var DebitNote $this */
        return [
            'id' => $this->id,
            'note_number' => $this->note_number,
            'reference_number' => $this->reference_number,
            'status' => $this->status,
            'type' => $this->type,
            'amount' => (float) $this->amount,
            'tax_amount' => (float) $this->tax_amount,
            'total_amount' => (float) $this->total_amount,
            'description' => $this->description,
            'internal_notes' => $this->internal_notes,
            'issue_date' => $this->issue_date?->toDateString(),
            'due_date' => $this->due_date?->toDateString(),
            'currency_code' => $this->currency_code,
            'exchange_rate' => (float) $this->exchange_rate,
            'items' => $this->items,
            'metadata' => $this->metadata,
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
            'createdBy' => $this->whenLoaded('createdBy', function () {
                return [
                    'id' => $this->createdBy->id,
                    'name' => $this->createdBy->name,
                ];
            }),
        ];
    }
}
