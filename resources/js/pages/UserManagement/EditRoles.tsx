import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Save, Shield, User, UserCog } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface Role {
    id: number;
    name: string;
    display_name: string;
    description?: string;
}

interface Permission {
    id: number;
    name: string;
    display_name: string;
}

interface UserData {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    email_verified_at: string | null;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
    roles: Role[];
    permissions: Permission[];
    tenant?: {
        id: number;
        name: string;
        type: string;
    };
}

interface Props {
    user: UserData;
    roles: Role[];
}

export default function UserManagementEditRoles({ user, roles }: Props) {
    const [selectedRoles, setSelectedRoles] = useState<number[]>(user.roles.map((role) => role.id));
    const [loading, setLoading] = useState(false);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((word) => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

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

    const handleRoleChange = (roleId: number, checked: boolean) => {
        if (checked) {
            setSelectedRoles([...selectedRoles, roleId]);
        } else {
            setSelectedRoles(selectedRoles.filter((id) => id !== roleId));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        router.post(
            route('user-management.update-roles', user.id),
            {
                roles: selectedRoles,
            },
            {
                onStart: () => {
                    toast.loading('Updating user roles...', { id: 'update-roles' });
                },
                onSuccess: () => {
                    toast.success(`Roles updated for ${user.name}`, {
                        id: 'update-roles',
                        description: 'User permissions have been updated successfully',
                        duration: 4000,
                    });
                    setLoading(false);
                },
                onError: (errors) => {
                    const message = (Object.values(errors)[0] as string) || 'Failed to update roles';
                    toast.error(message, {
                        id: 'update-roles',
                        description: 'Please try again or contact support',
                        duration: 5000,
                    });
                    setLoading(false);
                },
            },
        );
    };

    const formatRoleName = (roleName: string) => {
        return roleName.replace('_', ' ').toUpperCase();
    };

    return (
        <AppLayout>
            <Head title={`Manage Roles - ${user.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={route('user-management.show', user.id)}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to User
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Manage User Roles</h1>
                        <p className="text-muted-foreground">Update role assignments for {user.name}</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* User Info Sidebar */}
                    <div className="space-y-6">
                        {/* User Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    User Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start space-x-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarFallback className="text-sm">{getInitials(user.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-2">
                                        <div>
                                            <h3 className="font-semibold">{user.name}</h3>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>

                                        <Badge
                                            variant={user.is_active ? 'default' : 'secondary'}
                                            className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                                        >
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </Badge>

                                        <div className="text-sm text-muted-foreground">
                                            <p>Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</p>
                                            {user.last_login_at && (
                                                <p>Last login {formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true })}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Current Roles */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Current Roles
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {user.roles.length > 0 ? (
                                        user.roles.map((role) => (
                                            <Badge key={role.id} variant="outline" className={getRoleBadgeColor(role.name)}>
                                                {role.display_name || formatRoleName(role.name)}
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No roles assigned</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Permissions Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Permissions Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Direct Permissions</span>
                                        <span className="font-medium">{user.permissions.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Role-based Permissions</span>
                                        <span className="font-medium">
                                            {user.roles.reduce((total, role) => total + (role.permissions?.length || 0), 0)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Role Assignment Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit}>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <UserCog className="h-5 w-5" />
                                        Available Roles
                                    </CardTitle>
                                    <CardDescription>
                                        Select the roles you want to assign to this user. Changes will affect the user's permissions and access
                                        levels.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-4">
                                        {roles.map((role) => (
                                            <div key={role.id} className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50">
                                                <Checkbox
                                                    id={`role-${role.id}`}
                                                    checked={selectedRoles.includes(role.id)}
                                                    onCheckedChange={(checked) => handleRoleChange(role.id, !!checked)}
                                                    className="mt-0.5"
                                                />
                                                <div className="flex-1 space-y-1">
                                                    <Label htmlFor={`role-${role.id}`} className="cursor-pointer">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-medium">{role.display_name || formatRoleName(role.name)}</span>
                                                            <Badge variant="outline" className={`${getRoleBadgeColor(role.name)} text-xs`}>
                                                                {role.name}
                                                            </Badge>
                                                        </div>
                                                    </Label>
                                                    {role.description && <p className="text-sm text-muted-foreground">{role.description}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            {selectedRoles.length} of {roles.length} roles selected
                                        </div>

                                        <div className="flex space-x-4">
                                            <Link href={route('user-management.show', user.id)}>
                                                <Button type="button" variant="outline">
                                                    Cancel
                                                </Button>
                                            </Link>
                                            <Button type="submit" disabled={loading}>
                                                <Save className="mr-2 h-4 w-4" />
                                                {loading ? 'Updating...' : 'Update Roles'}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
