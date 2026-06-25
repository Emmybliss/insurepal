import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Eye, EyeOff, Info, Shield, User, UserPlus } from 'lucide-react';
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

interface Tenant {
    id: number;
    name: string;
    type: string;
}

interface Props {
    tenants: Tenant[];
    roles: Role[];
}

export default function CreateUser({ tenants, roles }: Props) {
    const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        tenant_id: '',
        roles: [] as number[],
        is_active: true,
        send_welcome_email: false,
    });

    useEffect(() => {
        setData('roles', selectedRoles);
    }, [selectedRoles]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.users.store'), {
            onSuccess: () => {
                toast.success('User created successfully');
                reset();
                setSelectedRoles([]);
            },
            onError: (errors) => {
                toast.error('Failed to create user');
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

    const isSuperAdmin = selectedRoles.some((roleId) => {
        const role = roles.find((r) => r.id === roleId);
        return role?.name === 'super_admin';
    });

    return (
        <AppLayout>
            <Head title="Create User" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Create User</h1>
                            <p className="text-muted-foreground">Create a new user account</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* User Information */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        User Information
                                    </CardTitle>
                                    <CardDescription>Basic information about the user</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {/* Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name *</Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="Enter full name"
                                                className={errors.name ? 'border-red-500' : ''}
                                            />
                                            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="Enter email address"
                                                className={errors.email ? 'border-red-500' : ''}
                                            />
                                            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {/* Password */}
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password *</Label>
                                            <div className="relative">
                                                <Input
                                                    id="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={data.password}
                                                    onChange={(e) => setData('password', e.target.value)}
                                                    placeholder="Enter password"
                                                    className={errors.password ? 'border-red-500' : ''}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4 text-gray-500" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-gray-500" />
                                                    )}
                                                </button>
                                            </div>
                                            {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                                        </div>

                                        {/* Password Confirmation */}
                                        <div className="space-y-2">
                                            <Label htmlFor="password_confirmation">Confirm Password *</Label>
                                            <div className="relative">
                                                <Input
                                                    id="password_confirmation"
                                                    type={showPasswordConfirmation ? 'text' : 'password'}
                                                    value={data.password_confirmation}
                                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                                    placeholder="Confirm password"
                                                    className={errors.password_confirmation ? 'border-red-500' : ''}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                                                >
                                                    {showPasswordConfirmation ? (
                                                        <EyeOff className="h-4 w-4 text-gray-500" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-gray-500" />
                                                    )}
                                                </button>
                                            </div>
                                            {errors.password_confirmation && <p className="text-sm text-red-600">{errors.password_confirmation}</p>}
                                        </div>
                                    </div>

                                    {/* Tenant Assignment */}
                                    <div className="space-y-2">
                                        <Label htmlFor="tenant_id">Tenant Assignment</Label>
                                        <Select
                                            value={data.tenant_id}
                                            onValueChange={(value) => setData('tenant_id', value === 'none' ? '' : value)}
                                            disabled={isSuperAdmin}
                                        >
                                            <SelectTrigger className={errors.tenant_id ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select tenant (optional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No Tenant (Super Admin)</SelectItem>
                                                {tenants.map((tenant) => (
                                                    <SelectItem key={tenant.id} value={tenant.id.toString()}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{tenant.name}</span>
                                                            <span className="text-sm text-muted-foreground capitalize">{tenant.type}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.tenant_id && <p className="text-sm text-red-600">{errors.tenant_id}</p>}
                                        {isSuperAdmin && <p className="text-sm text-orange-600">Super admin users cannot be assigned to a tenant</p>}
                                    </div>

                                    <Separator />

                                    {/* User Settings */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Active Status</Label>
                                                <p className="text-sm text-muted-foreground">Whether the user account is active</p>
                                            </div>
                                            <Switch checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked)} />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Send Welcome Email</Label>
                                                <p className="text-sm text-muted-foreground">Send login credentials via email</p>
                                            </div>
                                            <Switch
                                                checked={data.send_welcome_email}
                                                onCheckedChange={(checked) => setData('send_welcome_email', checked)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Role Assignment */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Roles
                                    </CardTitle>
                                    <CardDescription>Assign roles to the user</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {roles.length > 0 ? (
                                            <div className="space-y-3">
                                                {roles.map((role) => {
                                                    const isSelected = selectedRoles.includes(role.id);

                                                    return (
                                                        <div
                                                            key={role.id}
                                                            className={`rounded-lg border p-3 ${isSelected ? 'border-blue-300 bg-blue-50' : ''}`}
                                                        >
                                                            <div className="flex items-start space-x-3">
                                                                <Checkbox
                                                                    id={`role-${role.id}`}
                                                                    checked={isSelected}
                                                                    onCheckedChange={() => handleRoleToggle(role.id)}
                                                                />
                                                                <div className="flex-1 space-y-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label htmlFor={`role-${role.id}`} className="text-sm font-medium">
                                                                            {role.label || role.name}
                                                                        </Label>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={`${getRoleBadgeColor(role.name)} text-xs`}
                                                                        >
                                                                            {role.name}
                                                                        </Badge>
                                                                    </div>

                                                                    {role.description && (
                                                                        <p className="text-xs text-muted-foreground">{role.description}</p>
                                                                    )}

                                                                    <div className="flex items-center text-xs text-muted-foreground">
                                                                        <Shield className="mr-1 h-3 w-3" />
                                                                        {role.permissions_count} permissions
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center">
                                                <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                                <h3 className="mt-4 text-lg font-semibold">No roles available</h3>
                                                <p className="mt-2 text-sm text-muted-foreground">No active roles found.</p>
                                            </div>
                                        )}

                                        {errors.roles && <p className="text-sm text-red-600">{errors.roles}</p>}

                                        <div className="text-sm text-muted-foreground">
                                            <p>
                                                <strong>Selected Roles:</strong> {selectedRoles.length}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-4">
                        <Button type="button" variant="outline" onClick={() => router.visit(route('admin.users.index'))}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing || !data.name || !data.email || !data.password}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            {processing ? 'Creating...' : 'Create User'}
                        </Button>
                    </div>
                </form>

                {/* Creation Notice */}
                {(data.name || data.email) && (
                    <Card className="border-blue-200 bg-blue-50">
                        <CardHeader>
                            <CardTitle className="text-blue-800">User Creation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-blue-700">
                                Creating a new user account with {selectedRoles.length} role(s).
                                {data.send_welcome_email && ' A welcome email with login credentials will be sent.'}
                                {data.is_active ? ' The account will be active immediately.' : ' The account will be created as inactive.'}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Super Admin Warning */}
                {isSuperAdmin && (
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-800">
                                <Info className="h-5 w-5" />
                                Super Admin Notice
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-red-700">
                                You are creating a super admin user. This user will have full access to the system and will not be assigned to any
                                tenant. Super admin users can manage all tenants and system-wide settings.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
