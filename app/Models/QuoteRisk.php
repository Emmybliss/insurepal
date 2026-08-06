<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class QuoteRisk extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'quote_id',
        'policy_class_id',
        'policy_product_id',
        'description',
        'identifier',
        'location',
        'quantity',
        'coverage_amount',
        'rate',
        'rate_basis',
        'premium',
        'net_premium',
        'commission_rate',
        'commission_amount',
        'taxes',
        'fees',
        'dynamic_fields',
        'metadata',
        'inception_date',
        'expiry_date',
        'sort_order',
    ];

    protected $casts = [
        'coverage_amount' => 'decimal:2',
        'rate' => 'decimal:4',
        'premium' => 'decimal:2',
        'net_premium' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'taxes' => 'decimal:2',
        'fees' => 'decimal:2',
        'dynamic_fields' => 'array',
        'metadata' => 'array',
        'inception_date' => 'date',
        'expiry_date' => 'date',
    ];

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }

    public function policyClass(): BelongsTo
    {
        return $this->belongsTo(PolicyClass::class);
    }

    public function policyProduct(): BelongsTo
    {
        return $this->belongsTo(PolicyProduct::class);
    }

    public function getMergedFormFieldsAttribute(): array
    {
        return $this->policyProduct?->merged_form_fields ?? [];
    }

    public function getCoverageLabelAttribute(): string
    {
        return $this->policyProduct?->coverage_label ?? 'Sum Insured';
    }

    public function hasCustomPeriod(): bool
    {
        return $this->inception_date !== null && $this->expiry_date !== null;
    }

    public function getEffectiveInceptionDateAttribute(): ?Carbon
    {
        return $this->inception_date ?? $this->quote?->period_start;
    }

    public function getEffectiveExpiryDateAttribute(): ?Carbon
    {
        return $this->expiry_date ?? $this->quote?->period_end;
    }
}
