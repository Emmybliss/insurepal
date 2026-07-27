<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\Tenant;
use Illuminate\Support\Collection;

class PermissionService
{
    /**
     * Get all active system-owned permissions grouped by category.
     */
    public function getGroupedPermissions(?Tenant $tenant = null): Collection
    {
        $tenantId = $tenant?->id;

        $query = Permission::forTenant($tenantId)
            ->active();

        // When creating or editing roles for a tenant, hide Super Admin categories and platform permissions
        if ($tenant !== null || ! auth()->user()?->hasRole('super_admin')) {
            $superAdminCategories = [
                'Super Admin',
                'SuperAdmin',
                'Platform Administration',
                'System Administration',
            ];

            $superAdminPermissions = [
                'manage_tenants',
                'view_platform_analytics',
                'manage_system_settings',
                'manage_subscriptions',
                'access_telescope',
                'manage_backups',
            ];

            $query->where(function ($q) use ($superAdminCategories) {
                $q->whereNull('category')
                    ->orWhereNotIn('category', $superAdminCategories);
            })->whereNotIn('name', $superAdminPermissions);
        }

        return $query->orderBy('category')
            ->orderBy('name')
            ->get()
            ->groupBy(function (Permission $permission) {
                return $permission->category_label ?? 'General';
            });
    }

    /**
     * Resolve alias permission names to canonical names.
     */
    public function resolvePermissionName(string $permissionName): string
    {
        $aliases = [
            'view-customers' => 'view_customers',
            'customer.view' => 'view_customers',
            'customer.create' => 'create_customers',
            'customer.update' => 'edit_customers',
            'customer.delete' => 'delete_customers',

            'policy.view' => 'view_policies',
            'policy.create' => 'create_policies',
            'policy.update' => 'edit_policies',
            'policy.delete' => 'delete_policies',
            'policy.renew' => 'renew_policies',

            'quote.view' => 'view_quotes',
            'quote.create' => 'create_quotes',
            'quote.update' => 'edit_quotes',
            'quote.delete' => 'delete_quotes',

            'user.view' => 'view_users',
            'user.create' => 'create_users',
            'user.update' => 'edit_users',
            'user.delete' => 'delete_users',
            'user.manage_roles' => 'manage_roles',

            'role.view' => 'view_permissions',
            'role.manage' => 'manage_roles',
        ];

        return $aliases[$permissionName] ?? $permissionName;
    }
}
