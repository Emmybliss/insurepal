<?php

namespace App\Models;

use App\Enums\AllocationType;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class RemittanceAllocation extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'remittance_id',
        'allocatable_type',
        'allocatable_id',
        'allocation_type',
        'amount',
        'currency',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'allocation_type' => AllocationType::class,
            'amount' => 'decimal:2',
        ];
    }

    public function remittance(): BelongsTo
    {
        return $this->belongsTo(Remittance::class, 'remittance_id');
    }

    public function allocatable(): MorphTo
    {
        return $this->morphTo();
    }
}
