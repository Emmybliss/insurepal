<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PolicyRisk extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'policy_id',
        'description',
        'coverage_amount',
        'rate',
        'rate_basis',
        'premium',
        'dynamic_fields',
        'sort_order',
    ];

    protected $casts = [
        'coverage_amount' => 'decimal:2',
        'rate' => 'decimal:4',
        'premium' => 'decimal:2',
        'dynamic_fields' => 'array',
    ];

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
