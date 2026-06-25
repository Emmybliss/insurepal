import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Info, Save, Shield, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Role {
    id: number;
    name: string;
    label: string;
    description: string;
    is_active: boolean;
    permissions_count: number;
}

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    tenant_id: number;
    created_at: string;
    roles: Role[];
}

interface Props {
    user: User;
    roles: Role[];
}

export default function EditUserRole({ user, roles }: Props) {
    const [selectedRoles, setSelectedRoles] = useState<number[]>(user.roles.map((role) => role.id));

    const { setData, put, processing, errors } = useForm({
        roles: user.roles.map((role) => role.id),
    });

    useEffect(() => {
        setData('roles', selectedRoles);
    }, [selectedRoles]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.user-roles.update', user.id), {
            onSuccess: () => {
                toast.success('User roles updated successfully');
            },
            onError: (errors) => {
                toast.error('Failed to update user roles');
                console.error('Form errors:', errors);
            },
        });
    };

    const handleRoleToggle = (roleId: number) => {
        setSelectedRoles((prev) => (prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]));
    };

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

    const getCurrentlyAssignedRoles = () => user.roles.map((role) => role.id);
    const getNewlySelectedRoles = () => selectedRoles.filter((id) => !getCurrentlyAssignedRoles().includes(id));
    const getRolesBeingRemoved = () => getCurrentlyAssignedRoles().filter((id) => !selectedRoles.includes(id));

    const activeRoles = roles.filter((role) => role.is_active);

    return (
        <AppLayout>
            <Head title={`Edit User Roles - ${user.name}`} />

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
                            <h1 className="text-3xl font-bold tracking-tight">Edit User Roles</h1>
                            <p className="text-muted-foreground">Manage role assignments for {user.name}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* User Information */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        User Information
                                    </CardTitle>
                                    <CardDescription>Details about the selected user</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                                        <p className="text-lg font-semibold">{user.name}</p>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                                        <p className="text-sm">{user.email}</p>
                                        {user.email_verified_at && (
                                            <Badge variant="outline" className="mt-1 bg-green-50 text-green-700">
                                                Verified
                                            </Badge>
                                        )}
                                    </div>

                                    <Separator />

                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Current Roles</Label>
                                        <div className="mt-2 space-y-2">
                                            {user.roles.length > 0 ? (
                                                user.roles.map((role) => (
                                                    <div key={role.id} className="flex items-center justify-between rounded-md bg-gray-50 p-2">
                                                        <Badge variant="outline" className={getRoleBadgeColor(role.name)}>
                                                            {role.label || role.name}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">{role.permissions_count} permissions</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No roles assigned</p>
                                            )}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        <p>
                                            <strong>User ID:</strong> {user.id}
                                        </p>
                                        <p>
                                            <strong>Selected Roles:</strong> {selectedRoles.length} roles
                                        </p>
                                        {getNewlySelectedRoles().length > 0 && (
                                            <p className="text-green-600">
                                                <strong>Adding:</strong> {getNewlySelectedRoles().length} roles
                                            </p>
                                        )}
                                        {getRolesBeingRemoved().length > 0 && (
                                            <p className="text-red-600">
                                                <strong>Removing:</strong> {getRolesBeingRemoved().length} roles
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Role Assignment */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Role Assignment
                                    </CardTitle>
                                    <CardDescription>Select the roles to assign to this user</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {activeRoles.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                {activeRoles.map((role) => {
                                                    const isSelected = selectedRoles.includes(role.id);
                                                    const wasOriginallyAssigned = user.roles.some((r) => r.id === role.id);
                                                    const isNewlySelected = isSelected && !wasOriginallyAssigned;
                                                    const isBeingRemoved = !isSelected && wasOriginallyAssigned;

                                                    return (
                                                        <div
                                                            key={role.id}
                                                            className={`rounded-lg border p-4 ${
                                                                isNewlySelected
                                                                    ? 'border-green-300 bg-green-50'
                                                                    : isBeingRemoved
                                                                      ? 'border-red-300 bg-red-50'
                                                                      : isSelected
                                                                        ? 'border-blue-300 bg-blue-50'
                                                                        : ''
                                                            }`}
                                                        >
                                                            <div className="flex items-start space-x-3">
                                                                <Checkbox
                                                                    id={`role-${role.id}`}
                                                                    checked={isSelected}
                                                                    onCheckedChange={() => handleRoleToggle(role.id)}
                                                                />
                                                                <div className="flex-1 space-y-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label htmlFor={`role-${role.id}`} className="font-medium">
                                                                            {role.label || role.name}
                                                                        </Label>
                                                                        <Badge variant="outline" className={getRoleBadgeColor(role.name)}>
                                                                            {role.name}
                                                                        </Badge>
                                                                    </div>

                                                                    {role.description && (
                                                                        <p className="text-sm text-muted-foreground">{role.description}</p>
                                                                    )}

                                                                    <div className="flex items-center text-xs text-muted-foreground">
                                                                        <Shield className="mr-1 h-3 w-3" />
                                                                        {role.permissions_count} permissions
                                                                    </div>

                                                                    {wasOriginallyAssigned && (
                                                                        <div className="flex items-center text-xs text-blue-600">
                                                                            <Info className="mr-1 h-3 w-3" />
                                                                            Currently assigned
                                                                        </div>
                                                                    )}

                                                                    {isNewlySelected && (
                                                                        <div className="flex items-center text-xs text-green-600">
                                                                            <Info className="mr-1 h-3 w-3" />
                                                                            Will be added
                                                                        </div>
                                                                    )}

                                                                    {isBeingRemoved && (
                                                                        <div className="flex items-center text-xs text-red-600">
                                                                            <Info className="mr-1 h-3 w-3" />
                                                                            Will be removed
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center">
                                                <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                                <h3 className="mt-4 text-lg font-semibold">No active roles available</h3>
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    There are no active roles to assign to this user.
                                                </p>
                                                <div className="mt-6">
                                                    <Button asChild>
                                                        <Link href={route('admin.roles.index')}>Manage Roles</Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {errors.roles && <p className="mt-4 text-sm text-red-600">{errors.roles}</p>}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-4">
                        <Button type="button" variant="outline" onClick={() => router.visit(route('admin.user-roles.index'))}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Updating...' : 'Update Roles'}
                        </Button>
                    </div>
                </form>

                {/* Change Summary */}
                {(getNewlySelectedRoles().length > 0 || getRolesBeingRemoved().length > 0) && (
                    <Card className="border-orange-200 bg-orange-50">
                        <CardHeader>
                            <CardTitle className="text-orange-800">Change Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm text-orange-700">
                                {getNewlySelectedRoles().length > 0 && (
                                    <p>
                                        <strong>Roles being added:</strong> {getNewlySelectedRoles().length} role(s)
                                    </p>
                                )}
                                {getRolesBeingRemoved().length > 0 && (
                                    <p>
                                        <strong>Roles being removed:</strong> {getRolesBeingRemoved().length} role(s)
                                    </p>
                                )}
                                <p className="mt-2">These changes will take effect immediately and will modify the user's permissions.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
