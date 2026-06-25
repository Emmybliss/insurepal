import { Can, HasRole, PermissionGuard } from '@/components/auth/permission-guard';
import { Button } from '@/components/ui/button';
import { useAuth, usePermissions } from '@/hooks/use-permissions';

/**
 * Example component showing how to use the new Spatie-based authentication system
 * This file is for demonstration purposes and can be removed after implementation
 */
export function AuthExample() {
    const auth = useAuth();
    const permissions = usePermissions();

    return (
        <div className="space-y-4 p-4">
            <h2 className="text-xl font-semibold">Authentication & Permissions Demo</h2>

            {/* Basic auth info */}
            <div className="rounded bg-gray-100 p-4">
                <h3 className="mb-2 font-medium">Current User Info</h3>
                <p>Name: {auth.user?.name}</p>
                <p>Primary Role: {auth.user?.primary_role}</p>
                <p>All Roles: {auth.user?.roles.map((r) => r.label).join(', ')}</p>
                <p>Total Permissions: {auth.user?.permissions.length}</p>
            </div>

            {/* Role-based rendering */}
            <div className="space-y-2">
                <h3 className="font-medium">Role-based Rendering</h3>

                <HasRole role="super_admin">
                    <Button variant="destructive">Super Admin Only Button</Button>
                </HasRole>

                <HasRole role={['underwriter', 'broker']}>
                    <Button variant="default">Tenant Owner Button</Button>
                </HasRole>

                <HasRole role={['underwriter_staff', 'broker_staff']}>
                    <Button variant="secondary">Staff Button</Button>
                </HasRole>
            </div>

            {/* Permission-based rendering */}
            <div className="space-y-2">
                <h3 className="font-medium">Permission-based Rendering</h3>

                <Can permission="create_customers">
                    <Button>Create Customer</Button>
                </Can>

                <Can permission={['edit_customers', 'delete_customers']}>
                    <Button variant="outline">Manage Customers</Button>
                </Can>

                <Can permission="manage_tenants" fallback={<p className="text-gray-500">No tenant management access</p>}>
                    <Button variant="destructive">Manage Tenants</Button>
                </Can>
            </div>

            {/* Using hooks for conditional logic */}
            <div className="space-y-2">
                <h3 className="font-medium">Hook-based Logic</h3>

                {auth.isSuperAdmin && <p className="text-green-600">You are a Super Administrator</p>}

                {auth.isUnderwriter && <p className="text-blue-600">You are an Underwriter</p>}

                {auth.isBroker && <p className="text-purple-600">You are a Broker</p>}

                {auth.isStaff && <p className="text-orange-600">You are Staff</p>}

                {permissions.can('view_reports') && <Button variant="outline">View Reports</Button>}

                {permissions.hasAnyPermission(['create_quotes', 'edit_quotes']) && <Button>Quote Management</Button>}
            </div>

            {/* Complex permission guard */}
            <PermissionGuard
                permission={['view_customers', 'edit_customers']}
                role="underwriter"
                requireAll={true}
                fallback={<p className="text-red-500">Access denied: Need underwriter role AND customer permissions</p>}
            >
                <Button variant="default">Advanced Customer Management</Button>
            </PermissionGuard>

            {/* Debug info */}
            <details className="rounded bg-gray-50 p-4">
                <summary className="cursor-pointer font-medium">Debug Info</summary>
                <pre className="mt-2 overflow-auto text-xs">
                    {JSON.stringify(
                        {
                            roles: auth.user?.roles,
                            permissions: auth.user?.permissions,
                            can: auth.user?.can,
                        },
                        null,
                        2,
                    )}
                </pre>
            </details>
        </div>
    );
}
