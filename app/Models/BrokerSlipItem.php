<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrokerSlipItem extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'broker_slip_id',
        'item_type',
        'description',
        'identifier',
        'location',
        'quantity',
        'sum_insured',
        'rate',
        'rate_basis',
        'premium',
        'metadata',
        'sort_order',
    ];

    protected $casts = [
        'sum_insured' => 'decimal:2',
        'rate' => 'decimal:4',
        'premium' => 'decimal:2',
        'metadata' => 'array',
    ];

    public function brokerSlip(): BelongsTo
    {
        return $this->belongsTo(BrokerSlip::class);
    }
}
