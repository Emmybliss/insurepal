<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Receipt;
use Illuminate\Http\Request;

class ReceiptResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        /** @var Receipt $this */
        return [
            'id' => $this->id,
            'receipt_number' => $this->receipt_number,
            'payment_status' => $this->payment_status,
            'amount_paid' => (float) $this->amount_paid,
            'currency' => $this->currency,
            'payment_method' => $this->payment_method,
            'transaction_id' => $this->transaction_id,
            'payment_date' => $this->payment_date->toISOString(),
            'notes' => $this->notes,
            'file_path' => $this->file_path,
            'is_cleared' => (bool) $this->is_cleared,
            'cleared_at' => $this->cleared_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'invoice' => $this->whenLoaded('invoice', function () {
                return [
                    'id' => $this->invoice->id,
                    'invoice_number' => $this->invoice->invoice_number,
                ];
            }),
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
            'allocations' => $this->whenRelationLoaded('receiptAllocations', ReceiptAllocationResource::collection($this->receiptAllocations)),
        ];
    }
}
