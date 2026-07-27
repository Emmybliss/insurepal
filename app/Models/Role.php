<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    use \App\Models\Traits\HasAuditTrail;

    /**
     * Protected system role names that cannot be deleted or renamed by tenants.
     */
    public const PROTECTED_ROLES = [
        'super_admin',
        'underwriter',
        'underwriter_admin',
        'underwriter_staff',
        'broker',
        'broker_admin',
        'broker_staff',
        'customer',
    ];

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
        return $this->is_system_role || in_array($this->name, self::PROTECTED_ROLES, true);
    }

    public function isProtectedSystemRole(): bool
    {
        return $this->isSystemRole();
    }

    public function isGlobalRole(): bool
    {
        return is_null($this->tenant_id);
    }

    public function isTenantRole(): bool
    {
        return ! is_null($this->tenant_id);
    }

    /**
     * Get active roles available for tenant user management.
     * Restricts roles to tenant_admin and tenant_staff (e.g. broker_admin and broker_staff for broker tenants, underwriter_admin and underwriter_staff for underwriter tenants).
     * Excludes root tenant system roles (broker, underwriter), customer role, and super_admin role.
     */
    public static function forTenantOrGlobal(?int $tenantId, ?string $tenantType = null)
    {
        if (! $tenantId) {
            return static::active()
                ->global()
                ->whereNotIn('name', ['customer'])
                ->withCount('permissions')
                ->orderBy('name')
                ->get();
        }

        // Allowed role names by tenant type
        $allowedRoleNames = match ($tenantType) {
            'broker' => ['broker_admin', 'broker_staff', 'staff'],
            'underwriter' => ['underwriter_admin', 'underwriter_staff', 'staff'],
            default => ['broker_admin', 'broker_staff', 'underwriter_admin', 'underwriter_staff', 'staff'],
        };

        // Tenant-specific roles matching allowed names
        $tenantRoles = static::active()
            ->where('tenant_id', $tenantId)
            ->whereIn('name', $allowedRoleNames)
            ->withCount('permissions')
            ->get();

        $tenantRoleNames = $tenantRoles->pluck('name')->toArray();

        // Global fallback roles for names not present in tenant-specific roles
        $globalRoles = static::active()
            ->global()
            ->whereIn('name', array_diff($allowedRoleNames, $tenantRoleNames))
            ->withCount('permissions')
            ->get();

        return $tenantRoles->concat($globalRoles)->sortBy('name')->values();
    }
}
