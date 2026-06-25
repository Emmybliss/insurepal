<?php

namespace App\Models;

use App\Enums\AllocationType;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReceiptAllocation extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'receipt_id',
        'policy_id',
        'allocation_type',
        'amount',
        'currency',
        'exchange_rate',
        'is_direct_to_insurer',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'allocation_type' => AllocationType::class,
            'amount' => 'decimal:2',
            'exchange_rate' => 'decimal:6',
            'is_direct_to_insurer' => 'boolean',
        ];
    }

    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class, 'receipt_id');
    }

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class, 'policy_id');
    }
}
