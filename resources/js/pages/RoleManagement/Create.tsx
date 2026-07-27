import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckSquare, ChevronDown, ChevronRight, Search, Shield, Square } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface Permission {
    id: number;
    name: string;
    display_name?: string;
    description?: string;
    category?: string;
}

interface Props {
    permissions: Record<string, Permission[]>;
}

export default function RoleManagementCreate({ permissions }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        display_name: '',
        description: '',
        is_active: true,
        permissions: [] as number[],
    });

    const allPermissionIds = useMemo(() => {
        return Object.values(permissions).flatMap((categoryPermissions) => categoryPermissions.map((p) => p.id));
    }, [permissions]);

    const isAllSelected = useMemo(() => {
        return allPermissionIds.length > 0 && allPermissionIds.every((id) => data.permissions.includes(id));
    }, [allPermissionIds, data.permissions]);

    const toggleAllPermissions = () => {
        if (isAllSelected) {
            setData('permissions', []);
        } else {
            setData('permissions', [...allPermissionIds]);
        }
    };

    const toggleCategoryPermissions = (categoryPerms: Permission[]) => {
        const categoryIds = categoryPerms.map((p) => p.id);
        const allCategorySelected = categoryIds.every((id) => data.permissions.includes(id));

        if (allCategorySelected) {
            setData(
                'permissions',
                data.permissions.filter((id) => !categoryIds.includes(id)),
            );
        } else {
            const newSet = new Set([...data.permissions, ...categoryIds]);
            setData('permissions', Array.from(newSet));
        }
    };

    const toggleSinglePermission = (permissionId: number) => {
        if (data.permissions.includes(permissionId)) {
            setData(
                'permissions',
                data.permissions.filter((id) => id !== permissionId),
            );
        } else {
            setData('permissions', [...data.permissions, permissionId]);
        }
    };

    const toggleCollapseCategory = (category: string) => {
        setCollapsedCategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    const filteredPermissions = useMemo(() => {
        if (!searchQuery.trim()) return permissions;

        const query = searchQuery.toLowerCase();
        const filtered: Record<string, Permission[]> = {};

        Object.entries(permissions).forEach(([category, perms]) => {
            const matching = perms.filter(
                (p) =>
                    p.name.toLowerCase().includes(query) ||
                    (p.display_name && p.display_name.toLowerCase().includes(query)) ||
                    (p.description && p.description.toLowerCase().includes(query)),
            );
            if (matching.length > 0) {
                filtered[category] = matching;
            }
        });

        return filtered;
    }, [permissions, searchQuery]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('role-management.store'), {
            onStart: () => toast.loading('Creating role...', { id: 'create-role' }),
            onSuccess: () => toast.success('Role created successfully', { id: 'create-role' }),
            onError: (errs) => {
                const message = (Object.values(errs)[0] as string) || 'Failed to create role';
                toast.error(message, { id: 'create-role' });
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Create Role" />

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
                            <h1 className="text-3xl font-bold tracking-tight">Create Custom Role</h1>
                            <p className="text-muted-foreground">Define role details and assign system permissions</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Role Basic Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Details</CardTitle>
                            <CardDescription>Enter basic information for this custom tenant role</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="display_name">
                                        Display Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="display_name"
                                        placeholder="e.g. Senior Claims Inspector"
                                        value={data.display_name}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setData((prev) => ({
                                                ...prev,
                                                display_name: val,
                                                name: prev.name || val.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                                            }));
                                        }}
                                        required
                                    />
                                    {errors.display_name && <p className="text-sm text-red-500">{errors.display_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Role Key Identifier <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. senior_claims_inspector"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                        required
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe responsibilities and access granted by this role..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                />
                                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Permissions Selector */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div>
                                <CardTitle className="flex items-center space-x-2">
                                    <Shield className="h-5 w-5 text-primary" />
                                    <span>Permissions ({data.permissions.length} selected)</span>
                                </CardTitle>
                                <CardDescription>Select system permissions to assign to this role</CardDescription>
                            </div>

                            <div className="flex items-center space-x-3">
                                <Button type="button" variant="outline" size="sm" onClick={toggleAllPermissions}>
                                    {isAllSelected ? (
                                        <>
                                            <Square className="mr-2 h-4 w-4" /> Deselect All
                                        </>
                                    ) : (
                                        <>
                                            <CheckSquare className="mr-2 h-4 w-4" /> Select All ({allPermissionIds.length})
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Search Filter */}
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Filter permissions by module or action..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            {/* Permission Categories */}
                            <div className="space-y-4">
                                {Object.keys(filteredPermissions).length === 0 ? (
                                    <div className="py-8 text-center text-muted-foreground">No permissions match your search query.</div>
                                ) : (
                                    Object.entries(filteredPermissions).map(([category, perms]) => {
                                        const categoryIds = perms.map((p) => p.id);
                                        const selectedCategoryCount = categoryIds.filter((id) => data.permissions.includes(id)).length;
                                        const isCategoryAllSelected = selectedCategoryCount === categoryIds.length;
                                        const isCollapsed = collapsedCategories[category];

                                        return (
                                            <div key={category} className="rounded-lg border bg-card text-card-foreground shadow-sm">
                                                <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleCollapseCategory(category)}
                                                        className="flex items-center space-x-2 text-left font-medium"
                                                    >
                                                        {isCollapsed ? (
                                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                        <span>{category}</span>
                                                        <Badge variant="secondary" className="ml-2">
                                                            {selectedCategoryCount} / {perms.length}
                                                        </Badge>
                                                    </button>

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleCategoryPermissions(perms)}
                                                        className="text-xs"
                                                    >
                                                        {isCategoryAllSelected ? 'Deselect Category' : 'Select Category'}
                                                    </Button>
                                                </div>

                                                {!isCollapsed && (
                                                    <div className="grid gap-3 p-4 sm:grid-cols-2 md:grid-cols-3">
                                                        {perms.map((permission) => {
                                                            const isChecked = data.permissions.includes(permission.id);
                                                            return (
                                                                <div
                                                                    key={permission.id}
                                                                    className={`flex items-start space-x-3 rounded-md border p-3 transition-colors ${
                                                                        isChecked ? 'border-primary/50 bg-primary/5' : 'hover:bg-muted/50'
                                                                    }`}
                                                                >
                                                                    <Checkbox
                                                                        id={`perm-${permission.id}`}
                                                                        checked={isChecked}
                                                                        onCheckedChange={() => toggleSinglePermission(permission.id)}
                                                                        className="mt-0.5"
                                                                    />
                                                                    <div className="grid gap-1.5 leading-none">
                                                                        <label
                                                                            htmlFor={`perm-${permission.id}`}
                                                                            className="cursor-pointer text-sm font-medium leading-none"
                                                                        >
                                                                            {permission.display_name || permission.name}
                                                                        </label>
                                                                        {permission.description && (
                                                                            <p className="text-xs text-muted-foreground">{permission.description}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-4">
                        <Link href={route('role-management.index')}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Role'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
