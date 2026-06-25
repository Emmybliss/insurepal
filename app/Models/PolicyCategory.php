<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PolicyCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'policy_type_id',
        'name',
        'code',
        'description',
        'is_active',
        'form_fields',
        'premium_adjustment',
        'commission_adjustment',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'form_fields' => 'array',
        'premium_adjustment' => 'decimal:2',
        'commission_adjustment' => 'decimal:2',
    ];

    public function policyType(): BelongsTo
    {
        return $this->belongsTo(PolicyType::class);
    }

    public function policyClasses(): HasMany
    {
        return $this->hasMany(PolicyClass::class);
    }

    public function policies(): HasMany
    {
        return $this->hasMany(Policy::class);
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
        return $this->policyType->base_premium + $this->premium_adjustment;
    }

    public function getCalculatedCommissionRateAttribute()
    {
        return $this->policyType->commission_rate + $this->commission_adjustment;
    }
}
