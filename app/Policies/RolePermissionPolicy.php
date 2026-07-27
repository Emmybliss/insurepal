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
        if ($user->hasRole('super_admin')) {
            return true;
        }

        return ! is_null($user->tenant_id) && ($user->hasAnyPermission(['manage_roles', 'view_users', 'view_permissions']) || $user->hasAnyRole(['broker_admin', 'underwriter_admin', 'broker', 'underwriter']));
    }

    /**
     * Determine whether the user can view the role.
     */
    public function view(User $user, Role $role): bool
    {
        if ($user->hasRole('super_admin')) {
            return true;
        }

        if ($role->name === 'super_admin') {
            return false;
        }

        // Role must belong to the user's tenant or be a global role
        return is_null($role->tenant_id) || $role->tenant_id === $user->tenant_id;
    }

    /**
     * Determine whether the user can create roles.
     */
    public function create(User $user): bool
    {
        if ($user->hasRole('super_admin')) {
            return true;
        }

        return ! is_null($user->tenant_id) && ($user->hasPermissionTo('manage_roles') || $user->hasAnyRole(['broker_admin', 'underwriter_admin', 'broker', 'underwriter']));
    }

    /**
     * Determine whether the user can update the role.
     */
    public function update(User $user, Role $role): bool
    {
        if ($user->hasRole('super_admin')) {
            return true;
        }

        if ($role->isProtectedSystemRole()) {
            return false;
        }

        return $user->tenant_id === $role->tenant_id && ($user->hasPermissionTo('manage_roles') || $user->hasAnyRole(['broker_admin', 'underwriter_admin', 'broker', 'underwriter']));
    }

    /**
     * Determine whether the user can delete the role.
     */
    public function delete(User $user, Role $role): bool
    {
        if ($role->isProtectedSystemRole()) {
            return false;
        }

        if ($user->hasRole('super_admin')) {
            return true;
        }

        return $user->tenant_id === $role->tenant_id && ($user->hasPermissionTo('manage_roles') || $user->hasAnyRole(['broker_admin', 'underwriter_admin', 'broker', 'underwriter']));
    }

    /**
     * Determine whether the user can duplicate the role.
     */
    public function duplicate(User $user, Role $role): bool
    {
        return $this->view($user, $role) && $this->create($user);
    }

    /**
     * Determine whether the user can assign permissions to roles.
     */
    public function assignPermissionsToRole(User $user, Role $role): bool
    {
        return $this->update($user, $role);
    }

    /**
     * Determine whether the user can view any permissions.
     */
    public function viewAnyPermissions(User $user): bool
    {
        return ! is_null($user->tenant_id) || $user->hasRole('super_admin');
    }

    /**
     * Determine whether the user can create permissions (Platform Super Admin only).
     */
    public function createPermissions(User $user): bool
    {
        return $user->hasRole('super_admin');
    }

    /**
     * Determine whether the user can update permissions (Platform Super Admin only).
     */
    public function updatePermissions(User $user): bool
    {
        return $user->hasRole('super_admin');
    }

    /**
     * Determine whether the user can delete permissions (Platform Super Admin only).
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
        if ($user->hasRole('super_admin')) {
            return true;
        }

        if ($targetUser->hasRole('super_admin')) {
            return false;
        }

        return $user->tenant_id === $targetUser->tenant_id && ($user->hasPermissionTo('manage_roles') || $user->hasPermissionTo('edit_users') || $user->hasAnyRole(['broker_admin', 'underwriter_admin', 'broker', 'underwriter']));
    }

    /**
     * Determine whether the user can view user roles.
     */
    public function viewUserRoles(User $user, User $targetUser): bool
    {
        if ($user->hasRole('super_admin') || $user->id === $targetUser->id) {
            return true;
        }

        return $user->tenant_id === $targetUser->tenant_id;
    }
}
