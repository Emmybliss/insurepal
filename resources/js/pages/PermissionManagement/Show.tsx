import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Edit, Key, Shield } from 'lucide-react';

interface Permission {
    id: number;
    name: string;
    description: string;
    category: string;
    display_name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    roles: Array<{
        id: number;
        name: string;
        users_count?: number;
    }>;
}

interface Props {
    permission: Permission;
}

export default function ShowPermission({ permission }: Props) {
    const formatCategoryName = (category: string) => {
        if (!category) return 'Uncategorized';
        return category
            .replace(/[-_]/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <AppLayout>
            <Head title={`Permission - ${permission.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('permission-management.index')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Permission Details</h1>
                            <p className="text-muted-foreground">View permission information and assignments</p>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href={route('permission-management.edit', permission.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Permission
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Permission Details */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5" />
                                    Permission Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Display Name</label>
                                    <p className="text-lg font-semibold">{permission.display_name || permission.name}</p>
                                </div>

                                <Separator />

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Permission Name</label>
                                    <code className="mt-1 block rounded bg-gray-100 p-2 font-mono text-sm">{permission.name}</code>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                                    <div className="mt-1">
                                        <Badge variant="outline">{formatCategoryName(permission.category)}</Badge>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <div className="mt-1">
                                        <Badge variant={permission.is_active ? 'default' : 'secondary'}>
                                            {permission.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>

                                {permission.description && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                                        <p className="mt-1 text-sm">{permission.description}</p>
                                    </div>
                                )}

                                <Separator />

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Created</span>
                                        <span className="text-sm">{formatDistanceToNow(new Date(permission.created_at), { addSuffix: true })}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                                        <span className="text-sm">{formatDistanceToNow(new Date(permission.updated_at), { addSuffix: true })}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Assigned Roles */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Assigned Roles ({permission.roles.length})
                                </CardTitle>
                                <CardDescription>Roles that have this permission assigned</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {permission.roles.length > 0 ? (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Role Name</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {permission.roles.map((role) => (
                                                    <TableRow key={role.id}>
                                                        <TableCell>
                                                            <div className="flex items-center space-x-2">
                                                                <Badge variant="outline">{role.name}</Badge>
                                                            </div>
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
                                        <p className="mt-2 text-sm text-muted-foreground">This permission is not currently assigned to any roles.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
