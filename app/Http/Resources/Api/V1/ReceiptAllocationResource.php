<?php

namespace App\Http\Resources\Api\V1;

use App\Models\ReceiptAllocation;
use Illuminate\Http\Request;

class ReceiptAllocationResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        /** @var ReceiptAllocation $this */
        return [
            'id' => $this->id,
            'receipt_id' => $this->receipt_id,
            'policy_id' => $this->policy_id,
            'allocation_type' => $this->allocation_type,
            'amount' => (float) $this->amount,
            'currency' => $this->currency,
            'exchange_rate' => (float) $this->exchange_rate,
            'is_direct_to_insurer' => (bool) $this->is_direct_to_insurer,
            'notes' => $this->notes,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
