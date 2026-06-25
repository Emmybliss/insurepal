import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Edit, Key, Shield, Users } from 'lucide-react';

interface Permission {
    id: number;
    name: string;
    description: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Role {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
    permissions: Permission[];
    users: User[];
}

interface Props {
    role: Role;
}

export default function RoleShow({ role }: Props) {
    const getRoleBadgeColor = (roleName: string) => {
        const colors: Record<string, string> = {
            super_admin: 'bg-red-100 text-red-800',
            underwriter: 'bg-blue-100 text-blue-800',
            broker: 'bg-green-100 text-green-800',
            staff: 'bg-yellow-100 text-yellow-800',
            customer: 'bg-gray-100 text-gray-800',
        };
        return colors[roleName] || 'bg-purple-100 text-purple-800';
    };

    const groupPermissionsByCategory = (permissions: Permission[]) => {
        return permissions.reduce(
            (groups, permission) => {
                const parts = permission.name.split('-');
                const category = parts.length > 1 ? parts[1] : 'general';
                if (!groups[category]) {
                    groups[category] = [];
                }
                groups[category].push(permission);
                return groups;
            },
            {} as Record<string, Permission[]>,
        );
    };

    const formatCategoryName = (category: string) => {
        return category
            .replace(/[-_]/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const groupedPermissions = groupPermissionsByCategory(role.permissions);

    return (
        <AppLayout>
            <Head title={`Role: ${role.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('roles.index')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Roles
                            </Link>
                        </Button>
                        <div>
                            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                                <Badge variant="outline" className={getRoleBadgeColor(role.name)}>
                                    {role.name.replace('_', ' ').toUpperCase()}
                                </Badge>
                            </h1>
                            <p className="text-muted-foreground">{role.description || 'No description provided'}</p>
                        </div>
                    </div>
                    {role.name !== 'super_admin' && (
                        <Button asChild>
                            <Link href={route('roles.edit', role.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Role
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
                            <Key className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{role.permissions.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Assigned Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{role.users.length}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Created</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatDistanceToNow(new Date(role.created_at), { addSuffix: true })}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Permissions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Key className="mr-2 h-5 w-5" />
                                Permissions ({role.permissions.length})
                            </CardTitle>
                            <CardDescription>Permissions granted to this role</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {role.permissions.length > 0 ? (
                                <div className="space-y-6">
                                    {Object.entries(groupedPermissions).map(([category, permissions]) => (
                                        <div key={category}>
                                            <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
                                                {formatCategoryName(category)} ({permissions.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {permissions.map((permission) => (
                                                    <div key={permission.id} className="flex items-start space-x-3 rounded-lg border p-3">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-sm font-medium">
                                                                {permission.name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                                            </div>
                                                            {permission.description && (
                                                                <div className="mt-1 text-xs text-muted-foreground">{permission.description}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {Object.keys(groupedPermissions).length > 1 && <Separator className="mt-4" />}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-muted-foreground">No permissions assigned to this role</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Users */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Users className="mr-2 h-5 w-5" />
                                Assigned Users ({role.users.length})
                            </CardTitle>
                            <CardDescription>Users who have this role</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {role.users.length > 0 ? (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {role.users.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="font-medium">{user.name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="py-8 text-center text-muted-foreground">No users assigned to this role</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Role Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Role Details</CardTitle>
                        <CardDescription>Additional information about this role</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Role Name</label>
                                <div className="mt-1 text-sm">{role.name}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                                <div className="mt-1 text-sm">{new Date(role.created_at).toLocaleString()}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Description</label>
                                <div className="mt-1 text-sm">{role.description || 'No description provided'}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                                <div className="mt-1 text-sm">{new Date(role.updated_at).toLocaleString()}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
