<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PolicyClass extends Model
{
    use HasFactory;

    protected $fillable = [
        'policy_type_id',
        'name',
        'code',
        'description',
        'is_active',
        'form_fields',
        'premium_multiplier',
        'commission_multiplier',
        'risk_factors',
        'min_coverage_period',
        'max_coverage_period',
        'min_sum_assured',
        'max_sum_assured',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'form_fields' => 'array',
        'risk_factors' => 'array',
        'premium_multiplier' => 'decimal:4',
        'commission_multiplier' => 'decimal:4',
        'min_sum_assured' => 'decimal:2',
        'max_sum_assured' => 'decimal:2',
    ];

    public function policyType(): BelongsTo
    {
        return $this->belongsTo(PolicyType::class);
    }

    public function policies(): HasMany
    {
        return $this->hasMany(Policy::class);
    }

    public function policyProducts(): HasMany
    {
        return $this->hasMany(PolicyProduct::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    public function scopeForType($query, $policyTypeId)
    {
        return $query->where('policy_type_id', $policyTypeId);
    }

    public function getCalculatedPremiumAttribute()
    {
        return $this->policyType->base_premium * $this->premium_multiplier;
    }

    public function getCalculatedCommissionRateAttribute()
    {
        return $this->policyType->commission_rate * $this->commission_multiplier;
    }

    public function isValidSumAssured($sumAssured): bool
    {
        if ($sumAssured < $this->min_sum_assured) {
            return false;
        }

        if ($this->max_sum_assured && $sumAssured > $this->max_sum_assured) {
            return false;
        }

        return true;
    }

    public function isValidCoveragePeriod($days): bool
    {
        return $days >= $this->min_coverage_period && $days <= $this->max_coverage_period;
    }
}
