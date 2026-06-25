import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Save, Shield } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

interface Permission {
    id: number;
    name: string;
    description: string;
}

interface GroupedPermissions {
    [category: string]: Permission[];
}

interface Props {
    permissions: Permission[];
    grouped_permissions: GroupedPermissions;
    total_permissions: number;
}

export default function CreateRole({ grouped_permissions, total_permissions }: Props) {
    const { data, setData, errors, post, processing } = useForm({
        name: '',
        label: '',
        description: '',
        permissions: [] as number[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Show loading toast
        const loadingToastId = toast.loading('Creating role...', {
            description: 'Please wait while we create the new role',
        });

        post(route('admin.roles.store'), {
            onSuccess: () => {
                toast.dismiss(loadingToastId);
                toast.success('Role created successfully! 🎉', {
                    description: `"${data.label || data.name}" has been created with ${data.permissions.length} permission(s)`,
                    duration: 5000,
                });
            },
            onError: (errors) => {
                toast.dismiss(loadingToastId);

                // Handle specific validation errors
                if (errors.name) {
                    toast.error('Invalid role name', {
                        description: errors.name,
                        duration: 6000,
                    });
                } else if (errors.label) {
                    toast.error('Invalid role label', {
                        description: errors.label,
                        duration: 6000,
                    });
                } else {
                    toast.error('Failed to create role', {
                        description: 'Please check your input and try again',
                        duration: 6000,
                    });
                }

                console.error('Form errors:', errors);
            },
        });
    };

    const handlePermissionToggle = (permissionId: number) => {
        const updatedPermissions = data.permissions.includes(permissionId)
            ? data.permissions.filter((id) => id !== permissionId)
            : [...data.permissions, permissionId];

        setData('permissions', updatedPermissions);
    };

    const handleCategoryToggle = (category: string) => {
        const categoryPermissions = grouped_permissions[category] || [];
        const categoryPermissionIds = categoryPermissions.map((p) => p.id);

        const allSelected = categoryPermissionIds.every((id) => data.permissions.includes(id));

        if (allSelected) {
            // Remove all category permissions
            setData(
                'permissions',
                data.permissions.filter((id) => !categoryPermissionIds.includes(id)),
            );
        } else {
            // Add all category permissions
            const newPermissions = [...new Set([...data.permissions, ...categoryPermissionIds])];
            setData('permissions', newPermissions);
        }
    };

    const getCategorySelectionStatus = (category: string) => {
        const categoryPermissions = grouped_permissions[category] || [];
        const categoryPermissionIds = categoryPermissions.map((p) => p.id);
        const selectedCount = categoryPermissionIds.filter((id) => data.permissions.includes(id)).length;

        if (selectedCount === 0) return 'none';
        if (selectedCount === categoryPermissionIds.length) return 'all';
        return 'partial';
    };

    const formatCategoryName = (category: string) => {
        return category
            .replace(/[-_]/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <AdminLayout>
            <Head title="Create Role" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create Role</h1>
                        <p className="text-muted-foreground">Create a new role with specific permissions</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    {/* Role Details */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Shield className="mr-2 h-5 w-5" />
                                    Role Details
                                </CardTitle>
                                <CardDescription>Basic information about the role</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Role Name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Enter role name"
                                        required
                                    />
                                    {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Describe the role's purpose and responsibilities"
                                        rows={4}
                                    />
                                    {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                                </div>

                                <div className="pt-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Selected Permissions:</span>
                                        <Badge variant="secondary">
                                            {data?.permissions?.length} of {total_permissions}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Permissions */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Permissions</CardTitle>
                                <CardDescription>Select the permissions for this role</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {Object.entries(grouped_permissions).map(([category, categoryPermissions]) => {
                                        const selectionStatus = getCategorySelectionStatus(category);

                                        return (
                                            <div key={category} className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <Checkbox
                                                            checked={selectionStatus === 'all'}
                                                            indeterminate={selectionStatus === 'partial'}
                                                            onCheckedChange={() => handleCategoryToggle(category)}
                                                        />

                                                        <h3 className="text-lg font-semibold">{formatCategoryName(category)}</h3>
                                                        <Badge variant="outline" className="text-xs">
                                                            {categoryPermissions.length} permissions
                                                        </Badge>
                                                    </div>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {categoryPermissions.filter((p) => data.permissions.includes(p.id)).length} selected
                                                    </Badge>
                                                </div>

                                                <div className="ml-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                                                    {categoryPermissions.map((permission) => (
                                                        <div
                                                            key={permission.id}
                                                            className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50"
                                                        >
                                                            <Checkbox
                                                                checked={data.permissions.includes(permission.id)}
                                                                onCheckedChange={() => handlePermissionToggle(permission.id)}
                                                                className="mt-0.5"
                                                            />
                                                            <div className="min-w-0 flex-1">
                                                                <label className="cursor-pointer text-sm font-medium">
                                                                    {permission.name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                                                </label>
                                                                {permission.description && (
                                                                    <p className="mt-1 text-xs text-muted-foreground">{permission.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {Object.keys(grouped_permissions).length > 1 && <Separator className="my-4" />}
                                            </div>
                                        );
                                    })}
                                </div>

                                {errors.permissions && <p className="mt-4 text-sm text-red-600">{errors.permissions}</p>}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 lg:col-span-3">
                        <Button variant="outline" asChild>
                            <Link href={route('admin.roles.index')}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Creating...' : 'Create Role'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
