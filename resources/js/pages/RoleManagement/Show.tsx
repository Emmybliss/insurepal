import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Copy, Pencil, Shield, Users } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';

interface Permission {
    id: number;
    name: string;
    display_name?: string;
    description?: string;
    category?: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Role {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    is_system_role: boolean;
    is_active: boolean;
    permissions: Permission[];
    users?: User[];
    created_at: string;
}

interface Props {
    role: Role;
}

export default function RoleManagementShow({ role }: Props) {
    const groupedPermissions = useMemo(() => {
        const groups: Record<string, Permission[]> = {};
        (role.permissions || []).forEach((perm) => {
            const category = perm.category
                ? perm.category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                : 'General';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(perm);
        });
        return groups;
    }, [role.permissions]);

    const handleDuplicate = () => {
        if (confirm(`Duplicate the role "${role.display_name || role.name}"?`)) {
            router.post(
                route('role-management.duplicate', role.id),
                {},
                {
                    onStart: () => toast.loading('Duplicating role...', { id: 'dup-role' }),
                    onSuccess: () => toast.success('Role duplicated successfully', { id: 'dup-role' }),
                    onError: (errs) => {
                        const message = (Object.values(errs)[0] as string) || 'Failed to duplicate role';
                        toast.error(message, { id: 'dup-role' });
                    },
                },
            );
        }
    };

    return (
        <AppLayout>
            <Head title={`Role Details - ${role.display_name || role.name}`} />

            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href={route('role-management.index')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Roles
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center space-x-3">
                                <h1 className="text-3xl font-bold tracking-tight">{role.display_name || role.name}</h1>
                                <Badge className={role.is_system_role ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                                    {role.is_system_role ? 'System Role' : 'Custom Tenant Role'}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground">{role.description || 'No description provided'}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={handleDuplicate}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate Role
                        </Button>
                        {!role.is_system_role && (
                            <Link href={route('role-management.edit', role.id)}>
                                <Button size="sm">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Role
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Role Details */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Shield className="h-5 w-5 text-primary" />
                                <span>Assigned Permissions ({role.permissions?.length || 0})</span>
                            </CardTitle>
                            <CardDescription>Permissions granted to users assigned to this role</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {Object.keys(groupedPermissions).length === 0 ? (
                                <p className="text-center py-6 text-muted-foreground">No permissions assigned to this role.</p>
                            ) : (
                                Object.entries(groupedPermissions).map(([category, perms]) => (
                                    <div key={category} className="space-y-2 border-b pb-4 last:border-b-0">
                                        <h3 className="font-semibold text-sm text-foreground flex items-center justify-between">
                                            <span>{category}</span>
                                            <Badge variant="outline" className="text-xs">{perms.length}</Badge>
                                        </h3>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {perms.map((permission) => (
                                                <div key={permission.id} className="rounded-md border p-2.5 bg-muted/20">
                                                    <div className="text-xs font-medium">{permission.display_name || permission.name}</div>
                                                    {permission.description && (
                                                        <div className="text-[11px] text-muted-foreground mt-0.5">{permission.description}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Assigned Users */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Users className="h-5 w-5 text-primary" />
                                <span>Assigned Users ({role.users?.length || 0})</span>
                            </CardTitle>
                            <CardDescription>Tenant members with this role</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!role.users || role.users.length === 0 ? (
                                <p className="text-center py-6 text-sm text-muted-foreground">No users assigned to this role.</p>
                            ) : (
                                <div className="space-y-3">
                                    {role.users.map((user) => (
                                        <div key={user.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                                            <div>
                                                <div className="text-sm font-medium">{user.name}</div>
                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
