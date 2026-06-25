<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Permission\Models\Permission as SpatiePermission;

class Permission extends SpatiePermission
{
    protected $fillable = [
        'name',
        'display_name',
        'description',
        'guard_name',
        'tenant_id',
        'category',
        'is_system_permission',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_system_permission' => 'boolean',
            'is_active' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function scopeForTenant(Builder $query, ?int $tenantId = null): Builder
    {
        $tenantId = $tenantId ?? auth()->user()?->tenant_id;

        return $query->where('tenant_id', $tenantId);
    }

    public function scopeSystem(Builder $query): Builder
    {
        return $query->where('is_system_permission', true);
    }

    public function scopeNonSystem(Builder $query): Builder
    {
        return $query->where('is_system_permission', false);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeGlobal(Builder $query): Builder
    {
        return $query->whereNull('tenant_id');
    }

    public function scopeByCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    public function getFormattedNameAttribute(): string
    {
        return $this->display_name ?: str_replace('_', ' ', ucwords($this->name, '_'));
    }

    public function getCategoryLabelAttribute(): string
    {
        return $this->category ? str_replace('_', ' ', ucwords($this->category, '_')) : 'General';
    }

    public function isSystemPermission(): bool
    {
        return $this->is_system_permission;
    }

    public function isGlobalPermission(): bool
    {
        return is_null($this->tenant_id);
    }

    public function isTenantPermission(): bool
    {
        return ! is_null($this->tenant_id);
    }
}
