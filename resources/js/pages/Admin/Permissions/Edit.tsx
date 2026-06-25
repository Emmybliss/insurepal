import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Info, Key, Save, Users } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

interface Permission {
    id: number;
    name: string;
    module: string;
    label: string;
    description: string;
    is_active: boolean;
    roles_count: number;
    roles: Array<{
        id: number;
        name: string;
        label: string;
    }>;
}

interface Props {
    permission: Permission;
    modules: string[];
}

export default function EditPermission({ permission, modules }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: permission.name,
        module: permission.module || '',
        label: permission.label || '',
        description: permission.description || '',
        is_active: permission.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Show loading toast
        const loadingToastId = toast.loading('Updating permission...', {
            description: 'Please wait while we save your changes',
        });

        put(route('admin.permissions.update', permission.id), {
            onSuccess: () => {
                toast.dismiss(loadingToastId);
                toast.success('Permission updated successfully! ✅', {
                    description: `"${data.label || data.name}" has been updated in the ${data.module} module`,
                    duration: 5000,
                });
            },
            onError: (errors) => {
                toast.dismiss(loadingToastId);

                // Handle specific validation errors
                if (errors.name) {
                    toast.error('Invalid permission name', {
                        description: errors.name,
                        duration: 6000,
                    });
                } else if (errors.label) {
                    toast.error('Invalid permission label', {
                        description: errors.label,
                        duration: 6000,
                    });
                } else if (errors.module) {
                    toast.error('Invalid module selection', {
                        description: errors.module,
                        duration: 6000,
                    });
                } else {
                    toast.error('Failed to update permission', {
                        description: 'Please check your input and try again',
                        duration: 6000,
                    });
                }

                console.error('Form errors:', errors);
            },
        });
    };

    const formatModuleName = (module: string) => {
        return module
            .replace(/[-_]/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <AppLayout>
            <Head title={`Edit Permission - ${permission.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Edit Permission</h1>
                            <p className="text-muted-foreground">Update permission details</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5" />
                                    Permission Details
                                </CardTitle>
                                <CardDescription>Update the permission information</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="label">Display Label *</Label>
                                            <Input
                                                id="label"
                                                value={data.label}
                                                onChange={(e) => setData('label', e.target.value)}
                                                placeholder="e.g., View Users, Create Posts"
                                                required
                                            />
                                            {errors.label && <p className="text-sm text-red-600">{errors.label}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="name">Permission Name *</Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="e.g., view_users, create_posts"
                                                required
                                                disabled
                                            />
                                            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                            <p className="text-xs text-muted-foreground">Permission name cannot be changed after creation</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="module">Module *</Label>
                                        <Select value={data.module} onValueChange={(value) => setData('module', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a module" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {modules.map((module) => (
                                                    <SelectItem key={module} value={module}>
                                                        {formatModuleName(module)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.module && <p className="text-sm text-red-600">{errors.module}</p>}
                                        <p className="text-xs text-muted-foreground">Group this permission with related functionality</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Describe what this permission allows users to do"
                                            rows={3}
                                        />
                                        {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                                        />
                                        <Label htmlFor="is_active">Active Permission</Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Info className="h-4 w-4 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Inactive permissions cannot be assigned to roles</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>

                                    {!data.is_active && permission.roles_count > 0 && (
                                        <div className="rounded-md border border-orange-200 bg-orange-50 p-3">
                                            <p className="text-sm text-orange-800">
                                                ⚠️ This permission is currently assigned to {permission.roles_count} role(s). Deactivating it will
                                                prevent those roles from using this permission.
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-end space-x-4 pt-4">
                                        <Button type="button" variant="outline" onClick={() => router.visit(route('admin.permissions.index'))}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={processing}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {processing ? 'Updating...' : 'Update Permission'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Permission Info */}
                    <div className="space-y-6 lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Assigned Roles
                                </CardTitle>
                                <CardDescription>Roles that have this permission</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {permission.roles.length > 0 ? (
                                    <div className="space-y-2">
                                        {permission.roles.map((role) => (
                                            <div key={role.id} className="flex items-center justify-between rounded-md bg-gray-50 p-2">
                                                <span className="text-sm font-medium">{role.label || role.name}</span>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={route('admin.roles.show', role.id)}>View</Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">This permission is not assigned to any roles</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Permission Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <Label className="text-sm font-medium">Permission ID</Label>
                                    <p className="text-sm text-muted-foreground">{permission.id}</p>
                                </div>

                                <Separator />

                                <div>
                                    <Label className="text-sm font-medium">Assigned to Roles</Label>
                                    <p className="text-sm text-muted-foreground">{permission.roles_count} roles</p>
                                </div>

                                <div>
                                    <Label className="text-sm font-medium">Status</Label>
                                    <p className={`text-sm ${permission.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                        {permission.is_active ? 'Active' : 'Inactive'}
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-sm font-medium">Module</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {permission.module ? formatModuleName(permission.module) : 'Unassigned'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
