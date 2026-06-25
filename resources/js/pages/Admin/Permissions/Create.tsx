import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Info, Key, PlusCircle } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

interface Role {
    id: number;
    name: string;
    label: string;
}

interface Props {
    roles: Role[];
    modules: string[];
}

export default function CreatePermission({ roles, modules }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        label: '',
        description: '',
        module: '',
        roles: [] as number[],
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Show loading toast
        const loadingToastId = toast.loading('Creating permission...', {
            description: 'Please wait while we create the new permission',
        });

        post(route('admin.permissions.store'), {
            onSuccess: () => {
                toast.dismiss(loadingToastId);
                toast.success('Permission created successfully! 🎉', {
                    description: `"${data.label || data.name}" has been added to the ${data.module} module`,
                    duration: 5000,
                });
                reset();
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
                    toast.error('Failed to create permission', {
                        description: 'Please check your input and try again',
                        duration: 6000,
                    });
                }

                console.error('Form errors:', errors);
            },
        });
    };

    const generatePermissionName = () => {
        if (!data.label) return;

        const name = data.label
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_');

        setData('name', name);
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
            <Head title="Create Permission" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Create Permission</h1>
                            <p className="text-muted-foreground">Add a new system permission</p>
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
                                <CardDescription>Define the permission name, module, and description</CardDescription>
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
                                                onBlur={generatePermissionName}
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
                                            />
                                            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                                            <p className="text-xs text-muted-foreground">Unique identifier (lowercase, underscores allowed)</p>
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

                                    <div className="space-y-2">
                                        <Label>Assign to Roles (Optional)</Label>
                                        <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto rounded-lg border p-3 md:grid-cols-2">
                                            {roles.map((role) => (
                                                <div key={role.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`role-${role.id}`}
                                                        checked={data.roles.includes(role.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setData('roles', [...data.roles, role.id]);
                                                            } else {
                                                                setData(
                                                                    'roles',
                                                                    data.roles.filter((id) => id !== role.id),
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <Label htmlFor={`role-${role.id}`} className="text-sm">
                                                        {role.label || role.name}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                        {errors.roles && <p className="text-sm text-red-600">{errors.roles}</p>}
                                        <p className="text-xs text-muted-foreground">Select roles that should have this permission by default</p>
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

                                    <div className="flex items-center justify-end space-x-4 pt-4">
                                        <Button type="button" variant="outline" onClick={() => router.visit(route('admin.permissions.index'))}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={processing}>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            {processing ? 'Creating...' : 'Create Permission'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Help / Guidelines */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Guidelines</CardTitle>
                                <CardDescription>Best practices for creating permissions</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium">Naming Convention</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Use descriptive names like "view_users", "create_posts", "manage_settings"
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium">Module Grouping</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Group related permissions under the same module for better organization
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium">Common Actions</h4>
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                        <li>• view_* - Read access</li>
                                        <li>• create_* - Create new records</li>
                                        <li>• edit_* - Modify existing records</li>
                                        <li>• delete_* - Remove records</li>
                                        <li>• manage_* - Full administrative access</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium">Available Modules</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {modules.slice(0, 6).map((module) => (
                                            <span
                                                key={module}
                                                className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset"
                                            >
                                                {formatModuleName(module)}
                                            </span>
                                        ))}
                                        {modules.length > 6 && <span className="text-xs text-muted-foreground">+{modules.length - 6} more</span>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
