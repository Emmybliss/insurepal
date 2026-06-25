import { AuthExample } from '@/components/auth/auth-example';
import { Can, HasRole, PermissionGuard } from '@/components/auth/permission-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, usePermissions } from '@/hooks/use-permissions';
import { Head } from '@inertiajs/react';

export default function TestAuth() {
    const auth = useAuth();
    const permissions = usePermissions();

    return (
        <>
            <Head title="Test Spatie Authentication" />

            <div className="min-h-screen bg-gray-50 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Spatie Authentication Test Page</h1>
                        <p className="mt-2 text-gray-600">Testing the new role and permission system</p>
                    </div>

                    {/* Authentication Status */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>🔐 Authentication Status</CardTitle>
                            <CardDescription>Current user authentication information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {auth.isAuthenticated ? (
                                <div className="space-y-2">
                                    <p>
                                        <strong>User:</strong> {auth.user?.name} ({auth.user?.email})
                                    </p>
                                    <p>
                                        <strong>Primary Role:</strong> {auth.primaryRole}
                                    </p>
                                    <p>
                                        <strong>All Roles:</strong> {auth.roles.map((r) => r.label).join(', ')}
                                    </p>
                                    <p>
                                        <strong>Total Permissions:</strong> {auth.permissions.length}
                                    </p>
                                    <p>
                                        <strong>Tenant:</strong> {auth.user?.tenant?.name || 'None'}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-red-600">Not authenticated</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Role-based UI Tests */}
                    <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>👑 Role-based Components</CardTitle>
                                <CardDescription>Components that show/hide based on user roles</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <HasRole role="super_admin">
                                    <div className="rounded border border-red-200 bg-red-50 p-3">
                                        <p className="font-semibold text-red-800">🚨 Super Admin Content</p>
                                        <p className="text-sm text-red-600">Only super admins can see this</p>
                                    </div>
                                </HasRole>

                                <HasRole role={['underwriter', 'broker']}>
                                    <div className="rounded border border-blue-200 bg-blue-50 p-3">
                                        <p className="font-semibold text-blue-800">🏢 Tenant Owner Content</p>
                                        <p className="text-sm text-blue-600">Underwriters and brokers see this</p>
                                    </div>
                                </HasRole>

                                <HasRole role={['underwriter_staff', 'broker_staff']}>
                                    <div className="rounded border border-green-200 bg-green-50 p-3">
                                        <p className="font-semibold text-green-800">👥 Staff Content</p>
                                        <p className="text-sm text-green-600">Staff members see this</p>
                                    </div>
                                </HasRole>

                                <HasRole role="customer">
                                    <div className="rounded border border-purple-200 bg-purple-50 p-3">
                                        <p className="font-semibold text-purple-800">👤 Customer Content</p>
                                        <p className="text-sm text-purple-600">Customers see this</p>
                                    </div>
                                </HasRole>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>🔑 Permission-based Components</CardTitle>
                                <CardDescription>Components that show/hide based on permissions</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Can permission="view_customers">
                                    <Button variant="outline" className="w-full">
                                        👥 View Customers (Permission: view_customers)
                                    </Button>
                                </Can>

                                <Can permission="create_customers">
                                    <Button variant="default" className="w-full">
                                        ➕ Create Customer (Permission: create_customers)
                                    </Button>
                                </Can>

                                <Can permission="manage_tenants">
                                    <Button variant="destructive" className="w-full">
                                        🏗️ Manage Tenants (Permission: manage_tenants)
                                    </Button>
                                </Can>

                                <Can
                                    permission={['edit_customers', 'delete_customers']}
                                    fallback={<p className="text-sm text-gray-500">❌ No customer management permissions</p>}
                                >
                                    <Button variant="secondary" className="w-full">
                                        ⚙️ Customer Management (Multiple permissions)
                                    </Button>
                                </Can>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Complex Permission Guard Test */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>🛡️ Complex Permission Guard</CardTitle>
                            <CardDescription>Testing complex permission combinations</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PermissionGuard
                                permission={['view_customers', 'edit_customers']}
                                role="underwriter"
                                requireAll={true}
                                fallback={
                                    <div className="rounded border border-red-200 bg-red-50 p-4">
                                        <p className="text-red-800">❌ Access Denied</p>
                                        <p className="text-sm text-red-600">
                                            You need underwriter role AND both view_customers + edit_customers permissions
                                        </p>
                                    </div>
                                }
                            >
                                <div className="rounded border border-green-200 bg-green-50 p-4">
                                    <p className="text-green-800">✅ Advanced Access Granted</p>
                                    <p className="text-sm text-green-600">You have underwriter role AND both required permissions</p>
                                </div>
                            </PermissionGuard>
                        </CardContent>
                    </Card>

                    {/* Hook Usage Examples */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>🪝 Hook Usage Examples</CardTitle>
                            <CardDescription>Using useAuth and usePermissions hooks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <h4 className="mb-2 font-medium">Role Checks</h4>
                                    <ul className="space-y-1 text-sm">
                                        <li>Is Super Admin: {auth.isSuperAdmin ? '✅' : '❌'}</li>
                                        <li>Is Underwriter: {auth.isUnderwriter ? '✅' : '❌'}</li>
                                        <li>Is Broker: {auth.isBroker ? '✅' : '❌'}</li>
                                        <li>Is Staff: {auth.isStaff ? '✅' : '❌'}</li>
                                        <li>Is Customer: {auth.isCustomer ? '✅' : '❌'}</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="mb-2 font-medium">Permission Checks</h4>
                                    <ul className="space-y-1 text-sm">
                                        <li>Can view customers: {permissions.can('view_customers') ? '✅' : '❌'}</li>
                                        <li>Can create quotes: {permissions.can('create_quotes') ? '✅' : '❌'}</li>
                                        <li>Can manage tenants: {permissions.can('manage_tenants') ? '✅' : '❌'}</li>
                                        <li>Can view reports: {permissions.can('view_reports') ? '✅' : '❌'}</li>
                                        <li>
                                            Has any customer perms:{' '}
                                            {permissions.hasAnyPermission(['view_customers', 'create_customers']) ? '✅' : '❌'}
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Full Auth Example Component */}
                    <Card>
                        <CardHeader>
                            <CardTitle>📚 Complete Auth Example</CardTitle>
                            <CardDescription>Full demonstration component with all features</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AuthExample />
                        </CardContent>
                    </Card>

                    {/* Navigation */}
                    <div className="mt-8 text-center">
                        <Button onClick={() => window.history.back()} variant="outline">
                            ← Back to Application
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
