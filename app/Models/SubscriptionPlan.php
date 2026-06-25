<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SubscriptionPlan extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'setup_fee',
        'currency',
        'billing_cycle',
        'trial_days',
        'features',
        'max_users',
        'max_policies',
        'max_storage_gb',
        'is_active',
        'is_popular',
        'paystack_plan_code',
        'sort_order',
    ];

    protected $casts = [
        'features' => 'array',
        'price' => 'decimal:2',
        'setup_fee' => 'decimal:2',
        'is_active' => 'boolean',
        'is_popular' => 'boolean',
        'trial_days' => 'integer',
        'max_users' => 'integer',
        'max_policies' => 'integer',
        'max_storage_gb' => 'integer',
        'sort_order' => 'integer',
    ];

    public function tenants(): HasMany
    {
        return $this->hasMany(Tenant::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePopular($query)
    {
        return $query->where('is_popular', true);
    }

    public function scopeByCycle($query, string $cycle)
    {
        return $query->where('billing_cycle', $cycle);
    }

    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price, 2).' '.$this->currency;
    }

    public function getBillingCycleLabelAttribute(): string
    {
        return match ($this->billing_cycle) {
            'monthly' => 'per month',
            'quarterly' => 'per quarter',
            'semi_annually' => 'per six months',
            'yearly' => 'per year',
            default => '',
        };
    }
}
