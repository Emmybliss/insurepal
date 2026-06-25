import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Edit, Key, Mail, Shield, User } from 'lucide-react';

interface Permission {
    id: number;
    name: string;
    module: string;
    label: string;
    description: string;
    is_active: boolean;
}

interface Role {
    id: number;
    name: string;
    label: string;
    description: string;
    is_active: boolean;
    permissions_count: number;
    created_at: string;
    permissions: Permission[];
}

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    tenant_id: number;
    created_at: string;
    updated_at: string;
    roles: Role[];
}

interface Props {
    user: User;
}

export default function ShowUserRole({ user }: Props) {
    const getRoleBadgeColor = (roleName: string) => {
        const colors: Record<string, string> = {
            super_admin: 'bg-red-100 text-red-800',
            underwriter: 'bg-blue-100 text-blue-800',
            broker: 'bg-green-100 text-green-800',
            underwriter_staff: 'bg-yellow-100 text-yellow-800',
            broker_staff: 'bg-purple-100 text-purple-800',
            customer: 'bg-gray-100 text-gray-800',
        };
        return colors[roleName] || 'bg-slate-100 text-slate-800';
    };

    const formatModuleName = (module: string) => {
        return module
            .replace(/[-_]/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const getAllPermissions = () => {
        const permissionsMap = new Map();
        user.roles.forEach((role) => {
            role.permissions.forEach((permission) => {
                if (!permissionsMap.has(permission.id)) {
                    permissionsMap.set(permission.id, permission);
                }
            });
        });
        return Array.from(permissionsMap.values());
    };

    const groupPermissionsByModule = () => {
        const permissions = getAllPermissions();
        const grouped: Record<string, Permission[]> = {};

        permissions.forEach((permission) => {
            const module = permission.module || 'Unassigned';
            if (!grouped[module]) {
                grouped[module] = [];
            }
            grouped[module].push(permission);
        });

        return grouped;
    };

    const totalPermissions = getAllPermissions().length;
    const groupedPermissions = groupPermissionsByModule();

    return (
        <AppLayout>
            <Head title={`User Roles - ${user.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('admin.user-roles.index')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to User Roles
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">User Role Details</h1>
                            <p className="text-muted-foreground">View user information and role assignments</p>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href={route('admin.user-roles.edit', user.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Roles
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* User Information */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    User Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                                    <p className="text-lg font-semibold">{user.name}</p>
                                </div>

                                <Separator />

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                                    <div className="mt-1 flex items-center space-x-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{user.email}</span>
                                    </div>
                                    {user.email_verified_at && (
                                        <Badge variant="outline" className="mt-1 bg-green-50 text-green-700">
                                            Verified
                                        </Badge>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <div className="mt-1">
                                        <Badge variant={user.email_verified_at ? 'default' : 'secondary'}>
                                            {user.email_verified_at ? 'Active' : 'Unverified'}
                                        </Badge>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">User ID</span>
                                        <span className="text-sm">{user.id}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Assigned Roles</span>
                                        <span className="text-sm">{user.roles.length}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Total Permissions</span>
                                        <span className="text-sm">{totalPermissions}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Tenant ID</span>
                                        <span className="text-sm">{user.tenant_id}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Joined</span>
                                        <span className="text-sm">{formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                                        <span className="text-sm">{formatDistanceToNow(new Date(user.updated_at), { addSuffix: true })}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Assigned Roles */}
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Assigned Roles ({user.roles.length})
                                </CardTitle>
                                <CardDescription>Roles assigned to this user</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {user.roles.length > 0 ? (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Role Name</TableHead>
                                                    <TableHead>Description</TableHead>
                                                    <TableHead>Permissions</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Assigned</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {user.roles.map((role) => (
                                                    <TableRow key={role.id}>
                                                        <TableCell>
                                                            <div className="flex items-center space-x-2">
                                                                <Badge variant="outline" className={getRoleBadgeColor(role.name)}>
                                                                    {role.label || role.name}
                                                                </Badge>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="max-w-xs truncate">{role.description || 'No description'}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">
                                                                <Key className="mr-1 h-3 w-3" />
                                                                {role.permissions_count}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={role.is_active ? 'default' : 'secondary'}>
                                                                {role.is_active ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{formatDistanceToNow(new Date(role.created_at), { addSuffix: true })}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="sm" asChild>
                                                                <Link href={route('admin.roles.show', role.id)}>View Role</Link>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                        <h3 className="mt-4 text-lg font-semibold">No roles assigned</h3>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            This user has no roles assigned. They will have limited access to the system.
                                        </p>
                                        <div className="mt-6">
                                            <Button asChild>
                                                <Link href={route('admin.user-roles.edit', user.id)}>Assign Roles</Link>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Effective Permissions */}
                        {user.roles.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Key className="h-5 w-5" />
                                        Effective Permissions ({totalPermissions})
                                    </CardTitle>
                                    <CardDescription>All permissions granted to this user through their assigned roles</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {Object.entries(groupedPermissions).map(([module, permissions]) => (
                                            <div key={module} className="rounded-lg border p-4">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <h4 className="font-medium">{formatModuleName(module)}</h4>
                                                    <Badge variant="outline" className="text-xs">
                                                        {permissions.length} permissions
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                                    {permissions.map((permission) => (
                                                        <div
                                                            key={permission.id}
                                                            className="flex items-center justify-between rounded-md bg-gray-50 p-2"
                                                        >
                                                            <span className="text-sm font-medium">{permission.label || permission.name}</span>
                                                            <Badge variant={permission.is_active ? 'default' : 'secondary'} className="text-xs">
                                                                {permission.is_active ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Security Notice */}
                        {user.roles.length > 0 && (
                            <Card className="border-blue-200 bg-blue-50">
                                <CardHeader>
                                    <CardTitle className="text-blue-800">Security Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-blue-700">
                                        This user has {user.roles.length} role(s) assigned, granting them {totalPermissions} unique permission(s).
                                        Changes to any of their assigned roles will immediately affect this user's access level.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
