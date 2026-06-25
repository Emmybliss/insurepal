import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, Eye, EyeOff, Lock, Save, User, X } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface Role {
    id: number;
    name: string;
    display_name: string;
    description?: string;
}

interface Props {
    roles: Role[];
}

interface FormData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    is_active: boolean;
    send_invitation: boolean;
    roles: number[];
}

export default function UserManagementCreate({ roles }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        is_active: true,
        send_invitation: false,
        roles: [],
    });

    const passwordMatch = data.password !== '' && data.password_confirmation !== '' && data.password === data.password_confirmation;
    const passwordMismatch = data.password !== '' && data.password_confirmation !== '' && data.password !== data.password_confirmation;
    const checkPasswordStrength = (password: string) => ({
        length: password.length >= 8,
        letter: /[a-zA-Z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
    const strength = checkPasswordStrength(data.password);
    const strengthMet = Object.values(strength).filter(Boolean).length;
    const isStrong = strengthMet >= 4;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('user-management.store'), {
            onStart: () => {
                toast.loading('Creating user...', { id: 'create-user' });
            },
            onSuccess: () => {
                toast.success('User created successfully', {
                    id: 'create-user',
                    description: data.send_invitation ? 'Invitation email sent to user' : 'User can now log in with provided credentials',
                    duration: 5000,
                });
            },
            onError: () => {
                toast.error('Failed to create user', {
                    id: 'create-user',
                    description: 'Please check the form errors and try again',
                    duration: 5000,
                });
            },
        });
    };

    const handleRoleChange = (roleId: number, checked: boolean) => {
        if (checked) {
            setData('roles', [...data.roles, roleId]);
        } else {
            setData(
                'roles',
                data.roles.filter((id) => id !== roleId),
            );
        }
    };

    return (
        <AppLayout>
            <Head title="Create User" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={route('user-management.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Users
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create User</h1>
                        <p className="text-muted-foreground">Add a new user to your organization</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                            <CardDescription>Basic user details and credentials</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Enter full name"
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="email">Email Address *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="Enter email address"
                                    className={errors.email ? 'border-red-500' : ''}
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="password">Password *</Label>
                                    <div className="relative">
                                        <Lock className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="Enter password"
                                            className={`pr-10 pl-10 ${isStrong ? 'border-green-500' : data.password ? 'border-amber-500' : ''} ${errors.password ? 'border-red-500' : ''}`}
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                                            onClick={() => setShowPassword((v) => !v)}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {data.password && (
                                        <div className="mt-1 space-y-1 rounded-md bg-muted p-2 text-xs">
                                            <div
                                                className={`flex items-center gap-1.5 ${strength.length ? 'text-green-600' : 'text-muted-foreground'}`}
                                            >
                                                {strength.length ? '✓' : '✗'} Min 8 chars
                                            </div>
                                            <div
                                                className={`flex items-center gap-1.5 ${strength.letter ? 'text-green-600' : 'text-muted-foreground'}`}
                                            >
                                                {strength.letter ? '✓' : '✗'} Letter (a-z, A-Z)
                                            </div>
                                            <div
                                                className={`flex items-center gap-1.5 ${strength.number ? 'text-green-600' : 'text-muted-foreground'}`}
                                            >
                                                {strength.number ? '✓' : '✗'} Number (0-9)
                                            </div>
                                            <div
                                                className={`flex items-center gap-1.5 ${strength.symbol ? 'text-green-600' : 'text-muted-foreground'}`}
                                            >
                                                {strength.symbol ? '✓' : '✗'} Symbol (!@#$%^&*)
                                            </div>
                                        </div>
                                    )}
                                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="password_confirmation">Confirm Password *</Label>
                                    <div className="relative">
                                        <Lock className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="password_confirmation"
                                            type={showConfirm ? 'text' : 'password'}
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            placeholder="Confirm password"
                                            className={`pr-10 pl-10 ${!isStrong && data.password ? 'border-muted-foreground/50' : passwordMatch ? 'border-green-500' : passwordMismatch ? 'border-red-500' : ''} ${errors.password_confirmation ? 'border-red-500' : ''}`}
                                        />
                                        <div className="absolute inset-y-0 right-3 flex items-center gap-1">
                                            {data.password_confirmation !== '' && !isStrong && data.password && (
                                                <X className="h-4 w-4 text-amber-500" />
                                            )}
                                            {passwordMatch && isStrong && <Check className="h-4 w-4 text-green-500" />}
                                            {passwordMismatch && isStrong && <X className="h-4 w-4 text-red-500" />}
                                            <button
                                                type="button"
                                                className="ml-1 text-muted-foreground hover:text-foreground"
                                                onClick={() => setShowConfirm((v) => !v)}
                                                tabIndex={-1}
                                            >
                                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    {data.password_confirmation !== '' && (
                                        <p
                                            className={`mt-1 text-xs ${!isStrong && data.password ? 'text-amber-600' : passwordMatch ? 'text-green-600' : 'text-red-500'}`}
                                        >
                                            {!isStrong && data.password
                                                ? 'Please meet password requirements first'
                                                : passwordMatch
                                                  ? 'Passwords match'
                                                  : 'Passwords do not match'}
                                        </p>
                                    )}
                                    {errors.password_confirmation && <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Role Assignment */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Assignment</CardTitle>
                            <CardDescription>Assign roles to determine user permissions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {roles.map((role) => (
                                    <div key={role.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`role-${role.id}`}
                                            checked={data.roles.includes(role.id)}
                                            onCheckedChange={(checked) => handleRoleChange(role.id, !!checked)}
                                        />
                                        <Label htmlFor={`role-${role.id}`} className="text-sm">
                                            <div className="font-medium">{role.display_name}</div>
                                            {role.description && <div className="text-xs text-muted-foreground">{role.description}</div>}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {errors.roles && <p className="mt-1 text-sm text-red-600">{errors.roles}</p>}
                        </CardContent>
                    </Card>

                    {/* Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                            <CardDescription>Configure user status and notifications</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', !!checked)} />
                                <Label htmlFor="is_active">Active User</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="send_invitation"
                                    checked={data.send_invitation}
                                    onCheckedChange={(checked) => setData('send_invitation', !!checked)}
                                />
                                <Label htmlFor="send_invitation">Send invitation email to user</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4">
                        <Link href={route('user-management.index')}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Creating...' : 'Create User'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
