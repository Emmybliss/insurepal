<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class RoleService
{
    /**
     * Create a new custom role for a tenant.
     */
    public function createRole(Tenant $tenant, array $data, ?User $actor = null): Role
    {
        return DB::transaction(function () use ($tenant, $data, $actor) {
            $roleName = strtolower(str_replace(' ', '_', trim($data['name'])));

            $role = Role::create([
                'name' => $roleName,
                'display_name' => $data['display_name'] ?? $data['name'],
                'description' => $data['description'] ?? null,
                'guard_name' => 'web',
                'tenant_id' => $tenant->id,
                'is_system_role' => false,
                'is_active' => $data['is_active'] ?? true,
            ]);

            if (! empty($data['permissions'])) {
                $query = Permission::whereIn('id', $data['permissions']);
                if ($tenant !== null) {
                    $query->where(function ($q) {
                        $q->whereNull('category')
                            ->orWhereNotIn('category', ['Super Admin', 'SuperAdmin', 'Platform Administration', 'System Administration']);
                    })->whereNotIn('name', ['manage_tenants', 'view_platform_analytics', 'manage_system_settings', 'manage_subscriptions', 'access_telescope', 'manage_backups']);
                }
                $permissions = $query->get();
                $role->syncPermissions($permissions);
            }

            $role->logActivity(
                action: 'Role Created',
                description: "Created custom role '{$role->display_name}' ({$role->name})",
                metadata: [
                    'tenant_id' => $tenant->id,
                    'permissions_count' => count($data['permissions'] ?? []),
                ],
                user: $actor
            );

            return $role;
        });
    }

    /**
     * Update an existing custom role for a tenant.
     */
    public function updateRole(Role $role, array $data, ?User $actor = null): Role
    {
        if ($role->isProtectedSystemRole()) {
            throw new InvalidArgumentException("Cannot modify protected system role '{$role->name}'.");
        }

        return DB::transaction(function () use ($role, $data, $actor) {
            $oldPermissions = $role->permissions->pluck('name')->toArray();

            $role->update([
                'display_name' => $data['display_name'] ?? $role->display_name,
                'description' => $data['description'] ?? $role->description,
                'is_active' => $data['is_active'] ?? $role->is_active,
            ]);

            if (isset($data['permissions'])) {
                $query = Permission::whereIn('id', $data['permissions']);
                if ($role->tenant_id !== null) {
                    $query->where(function ($q) {
                        $q->whereNull('category')
                            ->orWhereNotIn('category', ['Super Admin', 'SuperAdmin', 'Platform Administration', 'System Administration']);
                    })->whereNotIn('name', ['manage_tenants', 'view_platform_analytics', 'manage_system_settings', 'manage_subscriptions', 'access_telescope', 'manage_backups']);
                }
                $permissions = $query->get();
                $role->syncPermissions($permissions);
            }

            $role->load('permissions');
            $newPermissions = $role->permissions->pluck('name')->toArray();

            $role->logActivity(
                action: 'Role Updated',
                description: "Updated custom role '{$role->display_name}' ({$role->name})",
                metadata: [
                    'tenant_id' => $role->tenant_id,
                    'permissions_added' => array_values(array_diff($newPermissions, $oldPermissions)),
                    'permissions_removed' => array_values(array_diff($oldPermissions, $newPermissions)),
                ],
                user: $actor
            );

            return $role;
        });
    }

    /**
     * Delete a custom tenant role.
     */
    public function deleteRole(Role $role, ?User $actor = null): void
    {
        if ($role->isProtectedSystemRole()) {
            throw new InvalidArgumentException("Cannot delete protected system role '{$role->name}'.");
        }

        if ($role->users()->exists()) {
            throw new InvalidArgumentException("Cannot delete role '{$role->display_name}' because it is assigned to users.");
        }

        DB::transaction(function () use ($role, $actor) {
            $role->logActivity(
                action: 'Role Deleted',
                description: "Deleted custom role '{$role->display_name}' ({$role->name})",
                metadata: [
                    'tenant_id' => $role->tenant_id,
                ],
                user: $actor
            );

            $role->delete();
        });
    }

    /**
     * Duplicate an existing role for a tenant.
     */
    public function duplicateRole(Role $role, ?string $newDisplayName = null, ?User $actor = null): Role
    {
        $tenantId = $role->tenant_id ?? $actor?->tenant_id;

        if (! $tenantId) {
            throw new InvalidArgumentException('Tenant context is required to duplicate a role.');
        }

        $tenant = Tenant::findOrFail($tenantId);
        $displayName = $newDisplayName ?: ($role->display_name ?? $role->name).' (Copy)';

        // Unique name generation
        $baseName = strtolower(str_replace(' ', '_', trim($displayName)));
        $uniqueName = $baseName;
        $counter = 1;
        while (Role::where('tenant_id', $tenant->id)->where('name', $uniqueName)->exists()) {
            $uniqueName = "{$baseName}_{$counter}";
            $counter++;
        }

        $permissionIds = $role->permissions()->pluck('id')->toArray();

        return $this->createRole(
            tenant: $tenant,
            data: [
                'name' => $uniqueName,
                'display_name' => $displayName,
                'description' => "Duplicated from '{$role->display_name}'",
                'is_active' => true,
                'permissions' => $permissionIds,
            ],
            actor: $actor
        );
    }

    /**
     * Safely assign allowed tenant roles to a user.
     */
    public function assignRolesToUser(User $targetUser, array $roleIds, Tenant $tenant, ?User $actor = null): User
    {
        if ($targetUser->tenant_id !== $tenant->id) {
            throw new InvalidArgumentException('User does not belong to the specified tenant.');
        }

        $allowedRoles = Role::forTenantOrGlobal($tenant->id, $tenant->type);
        $validRoles = $allowedRoles->whereIn('id', $roleIds);

        // Check if removing the last admin from tenant
        $adminRoles = ['broker_admin', 'underwriter_admin', 'broker', 'underwriter'];
        $hasAdminRoleCurrently = $targetUser->roles->contains(fn ($r) => in_array($r->name, $adminRoles));
        $willHaveAdminRole = $validRoles->contains(fn ($r) => in_array($r->name, $adminRoles));

        if ($hasAdminRoleCurrently && ! $willHaveAdminRole) {
            $otherAdminsCount = User::forTenant($tenant->id)
                ->where('id', '!=', $targetUser->id)
                ->whereHas('roles', fn ($q) => $q->whereIn('name', $adminRoles))
                ->count();

            if ($otherAdminsCount === 0) {
                throw new InvalidArgumentException('Cannot remove administrator role from the last tenant admin.');
            }
        }

        $oldRoles = $targetUser->roles->pluck('name')->toArray();

        DB::transaction(function () use ($targetUser, $validRoles, $oldRoles, $actor) {
            $targetUser->syncRoles($validRoles);
            $newRoles = $targetUser->fresh()->roles->pluck('name')->toArray();

            $targetUser->logActivity(
                action: 'User Roles Updated',
                description: "Updated roles for user {$targetUser->name} ({$targetUser->email})",
                metadata: [
                    'old_roles' => $oldRoles,
                    'new_roles' => $newRoles,
                ],
                user: $actor
            );
        });

        return $targetUser;
    }
}
