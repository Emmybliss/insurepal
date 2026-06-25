import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Info, Shield, UserPlus, Users } from 'lucide-react';
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
    roles: Role[];
}

interface Props {
    users: User[];
    roles: Role[];
}

export default function CreateUserRole({ users, roles }: Props) {
    const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: '',
        roles: [] as number[],
    });

    useEffect(() => {
        setData('roles', selectedRoles);
    }, [selectedRoles]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.user-roles.store'), {
            onSuccess: () => {
                toast.success('User roles assigned successfully');
                reset();
                setSelectedRoles([]);
            },
            onError: (errors) => {
                toast.error('Failed to assign user roles');
                console.error('Form errors:', errors);
            },
        });
    };

    const handleRoleToggle = (roleId: number) => {
        setSelectedRoles((prev) => (prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]));
    };

    const getSelectedUser = () => {
        return users.find((user) => user.id.toString() === data.user_id);
    };

    const getUserCurrentRoles = () => {
        const user = getSelectedUser();
        return user?.roles || [];
    };

    const isRoleAlreadyAssigned = (roleId: number) => {
        const currentRoles = getUserCurrentRoles();
        return currentRoles.some((role) => role.id === roleId);
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

    const availableRoles = roles.filter((role) => role.is_active);

    return (
        <AppLayout>
            <Head title="Assign User Roles" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Assign User Roles</h1>
                            <p className="text-muted-foreground">Assign roles to a user</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* User Selection */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Select User
                                    </CardTitle>
                                    <CardDescription>Choose the user to assign roles to</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="user_id">User</Label>
                                        <Select value={data.user_id} onValueChange={(value) => setData('user_id', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a user" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.map((user) => (
                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{user.name}</span>
                                                            <span className="text-sm text-muted-foreground">{user.email}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.user_id && <p className="text-sm text-red-600">{errors.user_id}</p>}
                                    </div>

                                    {data.user_id && (
                                        <>
                                            <Separator />

                                            <div>
                                                <Label className="text-sm font-medium">Current Roles</Label>
                                                <div className="mt-2 space-y-2">
                                                    {getUserCurrentRoles().length > 0 ? (
                                                        getUserCurrentRoles().map((role) => (
                                                            <div
                                                                key={role.id}
                                                                className="flex items-center justify-between rounded-md bg-gray-50 p-2"
                                                            >
                                                                <Badge variant="outline" className={getRoleBadgeColor(role.name)}>
                                                                    {role.label || role.name}
                                                                </Badge>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {role.permissions_count} permissions
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">No roles assigned</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-sm text-muted-foreground">
                                                <p>
                                                    <strong>Selected New Roles:</strong> {selectedRoles.length} roles
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Role Assignment */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Available Roles
                                    </CardTitle>
                                    <CardDescription>Select the roles to assign to the user</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {availableRoles.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                {availableRoles.map((role) => {
                                                    const isCurrentlyAssigned = isRoleAlreadyAssigned(role.id);
                                                    const isSelected = selectedRoles.includes(role.id);

                                                    return (
                                                        <div
                                                            key={role.id}
                                                            className={`rounded-lg border p-4 ${
                                                                isCurrentlyAssigned
                                                                    ? 'border-gray-300 bg-gray-50'
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
                                                                    disabled={isCurrentlyAssigned}
                                                                />
                                                                <div className="flex-1 space-y-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label
                                                                            htmlFor={`role-${role.id}`}
                                                                            className={`font-medium ${
                                                                                isCurrentlyAssigned ? 'text-muted-foreground' : ''
                                                                            }`}
                                                                        >
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

                                                                    {isCurrentlyAssigned && (
                                                                        <div className="flex items-center text-xs text-orange-600">
                                                                            <Info className="mr-1 h-3 w-3" />
                                                                            Already assigned to user
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
                                                    All available roles are either inactive or already assigned.
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
                        <Button type="submit" disabled={processing || !data.user_id || selectedRoles.length === 0}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            {processing ? 'Assigning...' : 'Assign Roles'}
                        </Button>
                    </div>
                </form>

                {/* Warning Notice */}
                {selectedRoles.length > 0 && data.user_id && (
                    <Card className="border-orange-200 bg-orange-50">
                        <CardHeader>
                            <CardTitle className="text-orange-800">Assignment Notice</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-orange-700">
                                You are about to assign {selectedRoles.length} role(s) to the selected user. This will grant them all permissions
                                associated with these roles immediately.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
