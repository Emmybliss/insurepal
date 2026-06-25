<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    protected $fillable = [
        'name',
        'display_name',
        'description',
        'guard_name',
        'tenant_id',
        'is_system_role',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_system_role' => 'boolean',
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
        return $query->where('is_system_role', true);
    }

    public function scopeNonSystem(Builder $query): Builder
    {
        return $query->where('is_system_role', false);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeGlobal(Builder $query): Builder
    {
        return $query->whereNull('tenant_id');
    }

    public function getFormattedNameAttribute(): string
    {
        return $this->display_name ?: str_replace('_', ' ', ucwords($this->name, '_'));
    }

    public function isSystemRole(): bool
    {
        return $this->is_system_role;
    }

    public function isGlobalRole(): bool
    {
        return is_null($this->tenant_id);
    }

    public function isTenantRole(): bool
    {
        return ! is_null($this->tenant_id);
    }
}
