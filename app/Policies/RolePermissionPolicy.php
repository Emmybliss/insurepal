<?php

namespace App\Policies;

use App\Models\Role;
use App\Models\User;

class RolePermissionPolicy
{
    /**
     * Determine whether the user can view any roles.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(['view-roles', 'manage-roles']) || $user->hasRole('super_admin');
    }

    /**
     * Determine whether the user can view the role.
     */
    public function view(User $user, Role $role): bool
    {
        // Super admin can view all roles
        if ($user->hasRole('super_admin')) {
            return true;
        }

        // Prevent non-super-admin from viewing super_admin role
        if ($role->name === 'super_admin') {
            return false;
        }

        return $user->hasPermissionTo('view-roles');
    }

    /**
     * Determine whether the user can create roles.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create-roles') || $user->hasRole('super_admin');
    }

    /**
     * Determine whether the user can update the role.
     */
    public function update(User $user, Role $role): bool
    {
        // Super admin can update all roles
        if ($user->hasRole('super_admin')) {
            return true;
        }

        // Prevent non-super-admin from updating super_admin role
        if ($role->name === 'super_admin') {
            return false;
        }

        return $user->hasPermissionTo('update-roles');
    }

    /**
     * Determine whether the user can delete the role.
     */
    public function delete(User $user, Role $role): bool
    {
        // Prevent deletion of super_admin role
        if ($role->name === 'super_admin') {
            return false;
        }

        // Super admin can delete most roles
        if ($user->hasRole('super_admin')) {
            return true;
        }

        // Prevent non-super-admin from deleting protected roles
        $protectedRoles = ['underwriter', 'broker'];
        if (in_array($role->name, $protectedRoles)) {
            return false;
        }

        return $user->hasPermissionTo('delete-roles');
    }

    /**
     * Determine whether the user can assign permissions to roles.
     */
    public function assignPermissionsToRole(User $user, Role $role): bool
    {
        // Super admin can assign permissions to any role
        if ($user->hasRole('super_admin')) {
            return true;
        }

        // Prevent non-super-admin from modifying super_admin role
        if ($role->name === 'super_admin') {
            return false;
        }

        return $user->hasPermissionTo('manage-roles');
    }

    /**
     * Determine whether the user can view any permissions.
     */
    public function viewAnyPermissions(User $user): bool
    {
        return $user->hasAnyPermission(['view-permissions', 'manage-permissions']) || $user->hasRole('super_admin');
    }

    /**
     * Determine whether the user can create permissions.
     */
    public function createPermissions(User $user): bool
    {
        return $user->hasRole('super_admin');
    }

    /**
     * Determine whether the user can update permissions.
     */
    public function updatePermissions(User $user): bool
    {
        return $user->hasRole('super_admin');
    }

    /**
     * Determine whether the user can delete permissions.
     */
    public function deletePermissions(User $user): bool
    {
        return $user->hasRole('super_admin');
    }

    /**
     * Determine whether the user can assign roles to users.
     */
    public function assignRoles(User $user, User $targetUser): bool
    {
        // Super admin can assign roles to anyone
        if ($user->hasRole('super_admin')) {
            return true;
        }

        // Prevent modifying super admin users
        if ($targetUser->hasRole('super_admin')) {
            return false;
        }

        // Tenant-based access control
        if ($user->tenant_id !== $targetUser->tenant_id) {
            return false;
        }

        return $user->hasPermissionTo('manage-users');
    }

    /**
     * Determine whether the user can assign permissions to users.
     */
    public function assignPermissions(User $user, User $targetUser): bool
    {
        // Super admin can assign permissions to anyone
        if ($user->hasRole('super_admin')) {
            return true;
        }

        // Prevent modifying super admin users
        if ($targetUser->hasRole('super_admin')) {
            return false;
        }

        // Tenant-based access control
        if ($user->tenant_id !== $targetUser->tenant_id) {
            return false;
        }

        return $user->hasPermissionTo('manage-users');
    }

    /**
     * Determine whether the user can view user roles.
     */
    public function viewUserRoles(User $user, User $targetUser): bool
    {
        // Super admin can view anyone's roles
        if ($user->hasRole('super_admin')) {
            return true;
        }

        // Users can view their own roles
        if ($user->id === $targetUser->id) {
            return true;
        }

        // Tenant-based access control
        if ($user->tenant_id !== $targetUser->tenant_id) {
            return false;
        }

        return $user->hasPermissionTo('view-users');
    }

    /**
     * Determine whether the user can manage tenant users.
     */
    public function manageTenantUsers(User $user): bool
    {
        return $user->hasAnyPermission(['view-users', 'manage-users']) || $user->hasRole(['super_admin', 'underwriter', 'broker']);
    }

    /**
     * Determine whether the user can bulk assign roles.
     */
    public function bulkAssignRoles(User $user): bool
    {
        return $user->hasPermissionTo('manage-users') || $user->hasRole('super_admin');
    }
}
