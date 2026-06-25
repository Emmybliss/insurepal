<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InsuranceCompany extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'company_type',
        'email',
        'phone',
        'website',
        'address',
        'city',
        'state',
        'country',
        'naicom_reg_number',
        'ncrib_reg_number',
        'rc_number',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function contacts(): HasMany
    {
        return $this->hasMany(InsuranceCompanyContact::class);
    }

    public function branches(): HasMany
    {
        return $this->hasMany(InsuranceCompanyBranch::class);
    }

    public function activeBranches(): HasMany
    {
        return $this->branches()->where('is_active', true);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeByType(Builder $query, string $type): Builder
    {
        if ($type === 'all') {
            return $query;
        }

        return $query->where(function (Builder $q) use ($type) {
            $q->where('company_type', $type)
                ->orWhere('company_type', 'both');
        });
    }

    public function scopeFilterByType(Builder $query, ?string $type): Builder
    {
        if (! $type || $type === 'all') {
            return $query;
        }

        return $query->where('company_type', $type);
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (! $search) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")
                ->orWhere('naicom_reg_number', 'like', "%{$search}%")
                ->orWhere('ncrib_reg_number', 'like', "%{$search}%")
                ->orWhere('rc_number', 'like', "%{$search}%");
        });
    }
}
