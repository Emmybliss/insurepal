import { usePermissions } from '@/hooks/use-permissions';
import { ReactNode } from 'react';

interface PermissionGuardProps {
    children: ReactNode;
    permission?: string | string[];
    role?: string | string[];
    fallback?: ReactNode;
    requireAll?: boolean; // If true, requires all permissions/roles; if false, requires any
}

export function PermissionGuard({ children, permission, role, fallback = null, requireAll = false }: PermissionGuardProps) {
    const permissions = usePermissions();

    // Check permission access
    if (permission) {
        const hasPermissionAccess = Array.isArray(permission)
            ? requireAll
                ? permissions.hasAllPermissions(permission)
                : permissions.hasAnyPermission(permission)
            : permissions.hasPermission(permission);

        if (!hasPermissionAccess) {
            return <>{fallback}</>;
        }
    }

    // Check role access
    if (role) {
        const hasRoleAccess = Array.isArray(role)
            ? requireAll
                ? permissions.hasAllRoles(role)
                : permissions.hasAnyRole(role)
            : permissions.hasRole(role);

        if (!hasRoleAccess) {
            return <>{fallback}</>;
        }
    }

    return <>{children}</>;
}

interface CanProps {
    permission: string | string[];
    children: ReactNode;
    fallback?: ReactNode;
    requireAll?: boolean;
}

/**
 * Simple permission check component
 */
export function Can({ permission, children, fallback = null, requireAll = false }: CanProps) {
    return (
        <PermissionGuard permission={permission} fallback={fallback} requireAll={requireAll}>
            {children}
        </PermissionGuard>
    );
}

interface HasRoleProps {
    role: string | string[];
    children: ReactNode;
    fallback?: ReactNode;
    requireAll?: boolean;
}

/**
 * Simple role check component
 */
export function HasRole({ role, children, fallback = null, requireAll = false }: HasRoleProps) {
    return (
        <PermissionGuard role={role} fallback={fallback} requireAll={requireAll}>
            {children}
        </PermissionGuard>
    );
}
