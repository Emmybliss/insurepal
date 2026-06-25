<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PolicyType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'is_active',
        'form_fields',
        'base_premium',
        'commission_rate',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'form_fields' => 'array',
        'base_premium' => 'decimal:2',
        'commission_rate' => 'decimal:2',
    ];

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
}
