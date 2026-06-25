import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, Plus, Search, Shield, Trash2, Users } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface Role {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    is_system_role: boolean;
    is_active: boolean;
    permissions_count: number;
    users_count?: number;
    created_at: string;
    updated_at: string;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface RolesPagination {
    data: Role[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLinks[];
}

interface Props {
    roles: RolesPagination;
    filters: {
        search?: string;
        system?: boolean;
        status?: string;
    };
    stats: {
        total: number;
        active: number;
        system: number;
        custom: number;
    };
}

export default function RoleManagementIndex({ roles, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('role-management.index'),
            { search },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleFilterChange = (key: string, value: string | boolean | null) => {
        const newFilters = { ...filters, [key]: value };
        if (value === null || value === '') {
            delete newFilters[key];
        }

        router.get(route('role-management.index'), newFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const handleToggleStatus = (role: Role) => {
        if (role.is_system_role) {
            toast.error('Cannot modify system role status');
            return;
        }

        const action = role.is_active ? 'deactivate' : 'activate';

        if (confirm(`Are you sure you want to ${action} the role "${role.display_name || role.name}"?`)) {
            router.post(
                route('role-management.toggle-status', role.id),
                {},
                {
                    onStart: () => {
                        toast.loading(`${action === 'activate' ? 'Activating' : 'Deactivating'} role...`, { id: 'toggle-role' });
                    },
                    onSuccess: () => {
                        toast.success(`Role ${action}d successfully`, {
                            id: 'toggle-role',
                            duration: 4000,
                        });
                    },
                    onError: (errors) => {
                        const message = (Object.values(errors)[0] as string) || `Failed to ${action} role`;
                        toast.error(message, {
                            id: 'toggle-role',
                            duration: 5000,
                        });
                    },
                },
            );
        }
    };

    const handleDelete = (role: Role) => {
        if (role.is_system_role) {
            toast.error('Cannot delete system roles');
            return;
        }

        if (confirm(`Are you sure you want to delete the role "${role.display_name || role.name}"? This action cannot be undone.`)) {
            router.delete(route('role-management.destroy', role.id), {
                onStart: () => {
                    toast.loading('Deleting role...', { id: 'delete-role' });
                },
                onSuccess: () => {
                    toast.success('Role deleted successfully', {
                        id: 'delete-role',
                        description: 'The role and all its assignments have been removed',
                        duration: 4000,
                    });
                },
                onError: (errors) => {
                    const message = (Object.values(errors)[0] as string) || 'Failed to delete role';
                    toast.error(message, {
                        id: 'delete-role',
                        duration: 5000,
                    });
                },
            });
        }
    };

    const getRoleBadgeColor = (role: Role) => {
        if (role.is_system_role) {
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        }
        return role.is_active
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    };

    return (
        <AppLayout>
            <Head title="Role Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
                        <p className="text-muted-foreground">Manage roles and permissions for your organization</p>
                    </div>
                    <Link href={route('role-management.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Role
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">System Roles</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.system}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Custom Roles</CardTitle>
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.custom}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>Filter and search roles</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <div className="flex-1">
                                <Label htmlFor="search">Search Roles</Label>
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder="Search by name or description..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="system-filter">Role Type</Label>
                                <Select
                                    value={filters.system === undefined ? '' : filters.system.toString()}
                                    onValueChange={(value) => handleFilterChange('system', value === '' ? null : value === 'true')}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="All types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">System Roles</SelectItem>
                                        <SelectItem value="false">Custom Roles</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="status-filter">Status</Label>
                                <Select
                                    value={filters.status || ''}
                                    onValueChange={(value) => handleFilterChange('status', value === '' ? null : value)}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button type="submit">Search</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Roles Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Roles ({roles.total})</CardTitle>
                        <CardDescription>Manage your organization's roles and permissions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {roles.data.length === 0 ? (
                            <div className="py-8 text-center">
                                <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-medium">No roles found</h3>
                                <p className="mt-2 text-muted-foreground">
                                    {Object.keys(filters).length > 0
                                        ? 'No roles match your current filters.'
                                        : 'Create your first role to get started.'}
                                </p>
                                {Object.keys(filters).length === 0 && (
                                    <Link href={route('role-management.create')} className="mt-4 inline-block">
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Role
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {roles.data.map((role) => (
                                    <div key={role.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-shrink-0">
                                                <Shield className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="font-medium">{role.display_name || role.name}</h3>
                                                    <Badge className={getRoleBadgeColor(role)}>{role.is_system_role ? 'System' : 'Custom'}</Badge>
                                                    <Badge variant={role.is_active ? 'default' : 'secondary'}>
                                                        {role.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                                {role.description && <p className="text-sm text-muted-foreground">{role.description}</p>}
                                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                    <span>{role.permissions_count} permissions</span>
                                                    {role.users_count !== undefined && <span>{role.users_count} users</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Link href={route('role-management.show', role.id)}>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>

                                            {!role.is_system_role && (
                                                <>
                                                    <Link href={route('role-management.edit', role.id)}>
                                                        <Button variant="outline" size="sm">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </Link>

                                                    <Button
                                                        variant={role.is_active ? 'outline' : 'default'}
                                                        size="sm"
                                                        onClick={() => handleToggleStatus(role)}
                                                    >
                                                        {role.is_active ? 'Deactivate' : 'Activate'}
                                                    </Button>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(role)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
