import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Info, Save, Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Permission {
    id: number;
    name: string;
    module: string;
    label: string;
    description: string;
    is_active: boolean;
}

interface Role {
    id: number;
    name: string;
    label: string;
    description: string;
    is_active: boolean;
    permissions: Permission[];
}

interface Props {
    role: Role;
    permissions: Permission[];
    permissionModules: Record<string, Permission[]>;
}

export default function EditRole({ role, permissions, permissionModules }: Props) {
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>(role.permissions.map((p) => Number(p.id)));
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
        label: role.label || '',
        description: role.description || '',
        is_active: role.is_active,
        permissions: role.permissions.map((p) => Number(p.id)),
    });

    useEffect(() => {
        setData('permissions', selectedPermissions);
    }, [selectedPermissions]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Show loading toast
        const loadingToastId = toast.loading('Updating role...', {
            description: 'Please wait while we save your changes',
        });

        put(route('admin.roles.update', role.id), {
            onSuccess: () => {
                toast.dismiss(loadingToastId);
                toast.success('Role updated successfully! ✅', {
                    description: `"${data.label || data.name}" has been updated with ${data.permissions.length} permission(s)`,
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
                    toast.error('Failed to update role', {
                        description: 'Please check your input and try again',
                        duration: 6000,
                    });
                }

                console.error('Form errors:', errors);
            },
        });
    };

    // Toggle ALL permissions in a module
    const handleModuleToggle = (module: string) => {
        const modulePermissions = permissionModules[module] || [];
        const moduleIds = modulePermissions.map((p) => Number(p.id));

        const allSelected = moduleIds.every((id) => selectedPermissions.includes(id));

        if (allSelected) {
            // Remove all in this module
            setSelectedPermissions((prev) => prev.filter((id) => !moduleIds.includes(id)));
        } else {
            // Add all in this module
            setSelectedPermissions((prev) => [...new Set([...prev, ...moduleIds])]);
        }
    };

    // Toggle ONE permission
    const handlePermissionToggle = (permissionId: number) => {
        setSelectedPermissions((prev) => (prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId]));
    };

    const toggleModule = (module: string) => {
        setExpandedModules((prev) => ({
            ...prev,
            [module]: !prev[module],
        }));
    };

    const isModuleFullySelected = (module: string): boolean => {
        const modulePermissions = permissionModules[module] || [];
        return modulePermissions.length > 0 && modulePermissions.every((p) => selectedPermissions.includes(Number(p.id)));
    };

    const isModulePartiallySelected = (module: string): boolean => {
        const modulePermissions = permissionModules[module] || [];
        return modulePermissions.some((p) => selectedPermissions.includes(Number(p.id))) && !isModuleFullySelected(module);
    };

    const formatModuleName = (module: string) => {
        return module
            .replace(/[-_]/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const formatPermissionName = (permission: Permission) => {
        return (
            permission.label ||
            permission.name
                .replace(/[-_]/g, ' ')
                .split(' ')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
        );
    };

    return (
        <AppLayout>
            <Head title={`Edit Role - ${role.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Edit Role</h1>
                            <p className="text-muted-foreground">Update role details and permissions</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Role Details */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Role Details
                                    </CardTitle>
                                    <CardDescription>Basic information about this role</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Role Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            disabled={role.name === 'super_admin'}
                                            placeholder="e.g., admin, manager, user"
                                        />
                                        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                        {role.name === 'super_admin' && (
                                            <p className="text-sm text-muted-foreground">Super admin role name cannot be changed</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="label">Display Label</Label>
                                        <Input
                                            id="label"
                                            value={data.label}
                                            onChange={(e) => setData('label', e.target.value)}
                                            placeholder="e.g., Administrator, Manager"
                                        />
                                        {errors.label && <p className="text-sm text-red-600">{errors.label}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Describe this role's purpose and responsibilities"
                                            rows={3}
                                        />
                                        {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                                            disabled={role.name === 'super_admin'}
                                        />
                                        <Label htmlFor="is_active">Active Role</Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Info className="h-4 w-4 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Inactive roles cannot be assigned to users</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>

                                    <Separator />

                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        <p>
                                            <strong>Total Modules:</strong> {Object.keys(permissionModules || {}).length}
                                        </p>
                                        <p>
                                            <strong>Total Permissions:</strong> {permissions.length}
                                        </p>
                                        <p>
                                            <strong>Selected:</strong> {selectedPermissions.length} permissions
                                        </p>
                                        <p>
                                            <strong>Modules with permissions:</strong>{' '}
                                            {
                                                Object.entries(permissionModules || {}).filter(([, modulePermissions]) =>
                                                    modulePermissions.some((p) => selectedPermissions.includes(Number(p.id))),
                                                ).length
                                            }
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Permissions */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Permissions Assignment</CardTitle>
                                    <CardDescription>
                                        Select the permissions this role should have. Permissions are grouped by module.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {Object.entries(permissionModules || {}).map(([module, modulePermissions]) => (
                                            <div key={module} className="rounded-lg border p-4">
                                                {/* Section 1 */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <Checkbox
                                                            checked={isModuleFullySelected(module)}
                                                            indeterminate={isModulePartiallySelected(module)}
                                                            onCheckedChange={() => handleModuleToggle(module)}
                                                        />

                                                        <div className="flex items-center space-x-2">
                                                            <h4 className="font-medium">{formatModuleName(module)}</h4>
                                                            <Badge variant="outline" className="text-xs">
                                                                {modulePermissions.filter((p) => selectedPermissions.includes(Number(p.id))).length}/
                                                                {modulePermissions.length}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => toggleModule(module)}>
                                                        {expandedModules[module] ? 'Collapse' : 'Expand'}
                                                    </Button>
                                                </div>
                                                {/* End of section 1 */}

                                                {/* Section 2 */}
                                                {expandedModules[module] && (
                                                    <div className="mt-3 grid grid-cols-1 gap-3 pl-6 md:grid-cols-2">
                                                        {modulePermissions.map((permission) => (
                                                            <div key={permission.id} className="flex items-start space-x-2">
                                                                <Checkbox
                                                                    id={`permission-${permission.id}`}
                                                                    checked={selectedPermissions.includes(Number(permission.id))}
                                                                    onCheckedChange={() => handlePermissionToggle(Number(permission.id))}
                                                                    disabled={!permission.is_active}
                                                                />
                                                                <div className="grid gap-1.5 leading-none">
                                                                    <Label
                                                                        htmlFor={`permission-${permission.id}`}
                                                                        className={`text-sm font-medium ${!permission.is_active ? 'text-muted-foreground line-through' : ''}`}
                                                                    >
                                                                        {formatPermissionName(permission)}
                                                                    </Label>
                                                                    {permission.description && (
                                                                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* End of section 2 */}
                                            </div>
                                        ))}
                                    </div>

                                    {errors.permissions && <p className="mt-4 text-sm text-red-600">{errors.permissions}</p>}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-4">
                        <Button type="button" variant="outline" onClick={() => router.visit(route('admin.roles.index'))}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Updating...' : 'Update Role'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
