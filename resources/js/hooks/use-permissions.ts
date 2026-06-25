import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import React from 'react';

export function usePermissions() {
    const { auth } = usePage<PageProps>().props;
    const user = auth?.user;

    if (!user) {
        return {
            can: () => false,
            hasRole: () => false,
            hasAnyRole: () => false,
            hasAllRoles: () => false,
            hasPermission: () => false,
            hasAnyPermission: () => false,
            hasAllPermissions: () => false,
            permissions: [],
            roles: [],
            primaryRole: null,
        };
    }

    return {
        /**
         * Check if user has a specific permission
         */
        can: (permission: string): boolean => {
            return user.permissions.includes(permission);
        },

        /**
         * Check if user has a specific role
         */
        hasRole: (role: string): boolean => {
            return user.roles.some((r) => r.name === role);
        },

        /**
         * Check if user has any of the given roles
         */
        hasAnyRole: (roles: string[]): boolean => {
            return roles.some((role) => user.roles.some((r) => r.name === role));
        },

        /**
         * Check if user has all of the given roles
         */
        hasAllRoles: (roles: string[]): boolean => {
            return roles.every((role) => user.roles.some((r) => r.name === role));
        },

        /**
         * Check if user has a specific permission by name
         */
        hasPermission: (permission: string): boolean => {
            return user.permissions.includes(permission);
        },

        /**
         * Check if user has any of the given permissions
         */
        hasAnyPermission: (permissions: string[]): boolean => {
            return permissions.some((permission) => user.permissions.includes(permission));
        },

        /**
         * Check if user has all of the given permissions
         */
        hasAllPermissions: (permissions: string[]): boolean => {
            return permissions.every((permission) => user.permissions.includes(permission));
        },

        /**
         * Get all user permissions
         */
        permissions: user.permissions,

        /**
         * Get all user roles
         */
        roles: user.roles,

        /**
         * Get primary role
         */
        primaryRole: user.primary_role,
    };
}

/**
 * Higher-order component for permission-based rendering
 * Note: This should be used in .tsx files since it returns JSX
 */
export function withPermission<P extends object>(
    Component: React.ComponentType<P>,
    requiredPermission: string | string[],
    fallback: React.ReactNode = null,
) {
    return function PermissionWrapper(props: P) {
        const permissions = usePermissions();

        const hasAccess = Array.isArray(requiredPermission)
            ? permissions.hasAnyPermission(requiredPermission)
            : permissions.hasPermission(requiredPermission);

        if (!hasAccess) {
            return fallback as React.ReactElement;
        }

        return React.createElement(Component, props);
    };
}

/**
 * Hook for role-based access
 */
export function useAuth() {
    const { auth } = usePage<PageProps>().props;
    const permissions = usePermissions();

    return {
        user: auth?.user,
        isAuthenticated: !!auth?.user,
        isSuperAdmin: permissions.hasRole('super_admin'),
        isUnderwriter: permissions.hasRole('underwriter'),
        isBroker: permissions.hasRole('broker'),
        isStaff: permissions.hasAnyRole(['underwriter_staff', 'broker_staff']),
        isCustomer: permissions.hasRole('customer'),
        ...permissions,
    };
}
