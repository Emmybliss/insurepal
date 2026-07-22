<?php

namespace App\Http\Resources\Api\V1;

use App\Models\InvoiceItem;
use Illuminate\Http\Request;

class InvoiceItemResource extends BaseResource
{
    public function toArray(Request $request): array
    {
        /** @var InvoiceItem $this */
        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'description' => $this->description,
            'quantity' => $this->quantity,
            'unit_price' => (float) $this->unit_price,
            'total' => (float) $this->total,
            'tax_rate' => (float) $this->tax_rate,
            'tax_amount' => (float) $this->tax_amount,
            'discount_rate' => (float) $this->discount_rate,
            'discount_amount' => (float) $this->discount_amount,
        ];
    }
}
